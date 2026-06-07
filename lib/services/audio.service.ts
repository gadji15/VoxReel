import 'server-only'

/**
 * VoxReel — audio service (SERVER-ONLY)
 *
 * Persists the `audio_files` row for a project (one per project — REPLACE
 * strategy) and flips the project status once audio is attached. The actual
 * file upload happens in the browser (see `lib/upload/audio-upload.ts`); this
 * only records metadata. User-scoped; never uses the admin client.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'

export type AudioFileRow = Database['public']['Tables']['audio_files']['Row']

/** Project status set once audio has been uploaded. */
export const STATUS_AUDIO_UPLOADED = 'audio_uploaded'

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

export interface AudioFileInput {
  fileName: string
  storageBucket: string
  storagePath: string
  mimeType: string | null
  sizeBytes: number | null
  durationSeconds: number | null
  status?: string
}

/** The project's audio row, or `null`. */
export async function getProjectAudio(projectId: string): Promise<AudioFileRow | null> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[audio.service] getProjectAudio failed:', error.message)
    return null
  }
  return data
}

/**
 * Replace the project's audio_files row with `input` and mark the project
 * `audio_uploaded`. Verifies the project belongs to the current user first.
 */
export async function upsertAudioFileRecord(
  projectId: string,
  input: AudioFileInput
): Promise<AudioFileRow> {
  const { supabase, user } = await getAuthedContext()

  // Ownership check (RLS also enforces this).
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) {
    throw new Error('[audio.service] project not found for current user')
  }

  // REPLACE: clear any existing audio rows for this project, then insert.
  const del = await supabase
    .from('audio_files')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) {
    throw new Error(`[audio.service] clear audio failed: ${del.error.message}`)
  }

  const { data, error } = await supabase
    .from('audio_files')
    .insert({
      project_id: projectId,
      user_id: user.id,
      file_name: input.fileName,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      duration_seconds: input.durationSeconds,
      status: input.status ?? 'ready',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`[audio.service] insert audio failed: ${error?.message ?? 'no row'}`)
  }

  // Advance the project lifecycle (+ keep duration in sync when known).
  const projectPatch: Database['public']['Tables']['projects']['Update'] = {
    status: STATUS_AUDIO_UPLOADED,
  }
  if (input.durationSeconds != null) projectPatch.duration_seconds = input.durationSeconds
  await supabase
    .from('projects')
    .update(projectPatch)
    .eq('id', projectId)
    .eq('user_id', user.id)

  return data
}

/** Remove the project's audio row (storage object cleanup is a follow-up). */
export async function deleteProjectAudio(projectId: string): Promise<void> {
  const { supabase, user } = await getAuthedContext()
  const { error } = await supabase
    .from('audio_files')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (error) {
    throw new Error(`[audio.service] deleteProjectAudio failed: ${error.message}`)
  }
}
