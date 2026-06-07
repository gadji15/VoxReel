import 'server-only'

/**
 * VoxReel — transcription service (SERVER-ONLY)
 *
 * Downloads the project's uploaded audio from Supabase Storage and transcribes
 * it with OpenAI Whisper (server-side only), then persists timestamped
 * `transcript_segments` (REPLACE strategy — no duplicates on re-run).
 *
 * Never calls OpenAI from the browser, never exposes the API key, never uses the
 * Supabase admin/service-role client.
 */

import { redirect } from 'next/navigation'
import { toFile } from 'openai'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createOpenAIClient } from '@/lib/openai/client'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import type { TranscriptLine } from '@/lib/types'
import { formatDuration } from '@/lib/mappers/project.mapper'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type AudioFileRow = Database['public']['Tables']['audio_files']['Row']

export const TRANSCRIPTION_MODEL = 'whisper-1'

/** Project lifecycle statuses around transcription. */
export const STATUS_TRANSCRIBING = 'transcribing'
export const STATUS_TRANSCRIBED = 'transcribed'
export const STATUS_FAILED = 'failed'

/** Minimal shape we read from Whisper's `verbose_json` response. */
interface VerboseTranscription {
  text: string
  duration?: number
  segments?: Array<{ id?: number; start: number; end: number; text: string }>
}

/** A normalized transcript segment with real start/end seconds. */
export interface TranscriptionSegmentInput {
  start: number
  end: number
  text: string
}

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

/**
 * Verify ownership + that an audio file exists for the project. Throws a clean,
 * user-safe error otherwise.
 */
export async function getProjectAudioForTranscription(
  projectId: string
): Promise<{ project: Pick<ProjectRow, 'id'>; audio: AudioFileRow }> {
  const { supabase, user } = await getAuthedContext()

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) {
    throw new Error('Project not found.')
  }

  const { data: audio } = await supabase
    .from('audio_files')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!audio || !audio.storage_path) {
    throw new Error('No uploaded audio found for this project. Please upload audio first.')
  }

  return { project, audio }
}

/** REPLACE the project's transcript_segments with the given segments. */
export async function saveTranscriptionSegments(
  projectId: string,
  segments: TranscriptionSegmentInput[]
): Promise<TranscriptLine[]> {
  const { supabase, user } = await getAuthedContext()

  const del = await supabase
    .from('transcript_segments')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) {
    throw new Error(`Failed to clear old transcript: ${del.error.message}`)
  }

  if (segments.length === 0) return []

  const rows = segments.map((seg, i) => ({
    project_id: projectId,
    user_id: user.id,
    segment_index: i + 1,
    start_time_seconds: Math.max(0, seg.start),
    end_time_seconds: Math.max(seg.end, seg.start),
    text: seg.text.trim(),
  }))

  const { error } = await supabase.from('transcript_segments').insert(rows)
  if (error) {
    throw new Error(`Failed to save transcript: ${error.message}`)
  }

  return segments.map((seg, i) => ({
    id: i + 1,
    start: formatDuration(seg.start),
    text: seg.text.trim(),
  }))
}

/**
 * Full MVP transcription pipeline for a project:
 * download audio → Whisper (verbose_json, segment timestamps) → persist
 * segments → mark project `transcribed`. Returns provider transcript lines.
 */
export async function transcribeProjectAudio(projectId: string): Promise<TranscriptLine[]> {
  const { supabase, user } = await getAuthedContext()
  const { audio } = await getProjectAudioForTranscription(projectId)

  // Best-effort: mark as transcribing before the (slow) OpenAI call.
  await supabase
    .from('projects')
    .update({ status: STATUS_TRANSCRIBING })
    .eq('id', projectId)
    .eq('user_id', user.id)

  try {
    // Download the audio from Storage (RLS lets the owner read their own file).
    const { data: blob, error: dlError } = await supabase.storage
      .from(audio.storage_bucket)
      .download(audio.storage_path as string)
    if (dlError || !blob) {
      throw new Error('Could not download the audio file from storage.')
    }

    const openai = createOpenAIClient()
    const fileName = audio.file_name ?? 'audio'
    const uploadable = await toFile(blob, fileName, {
      type: audio.mime_type ?? 'audio/mpeg',
    })

    const transcription = (await openai.audio.transcriptions.create({
      file: uploadable,
      model: TRANSCRIPTION_MODEL,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })) as unknown as VerboseTranscription

    // Normalize segments; fall back to a single segment if none were returned.
    let segments: TranscriptionSegmentInput[] = (transcription.segments ?? [])
      .map((s) => ({ start: s.start, end: s.end, text: s.text }))
      .filter((s) => s.text.trim().length > 0)

    if (segments.length === 0 && transcription.text?.trim()) {
      segments = [
        { start: 0, end: transcription.duration ?? 0, text: transcription.text.trim() },
      ]
    }

    const lines = await saveTranscriptionSegments(projectId, segments)

    await supabase
      .from('projects')
      .update({ status: STATUS_TRANSCRIBED })
      .eq('id', projectId)
      .eq('user_id', user.id)

    return lines
  } catch (err) {
    // Best-effort failure marker; rethrow a clean message (never leak the key).
    await supabase
      .from('projects')
      .update({ status: STATUS_FAILED })
      .eq('id', projectId)
      .eq('user_id', user.id)
    const message = err instanceof Error ? err.message : 'Transcription failed.'
    throw new Error(message)
  }
}

/** Read the saved transcript as provider lines (empty array if none). */
export async function getProjectTranscript(projectId: string): Promise<TranscriptLine[]> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('transcript_segments')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('segment_index', { ascending: true })

  if (error || !data) return []
  return data.map((row) => ({
    id: row.segment_index,
    start: formatDuration(row.start_time_seconds),
    text: row.text,
  }))
}
