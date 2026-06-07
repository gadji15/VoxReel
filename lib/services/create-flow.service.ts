import 'server-only'

/**
 * VoxReel — create-flow persistence service (SERVER-ONLY)
 *
 * Reads/writes the draft content of a single project (settings, transcript,
 * scenes, captions, export) for the authenticated user. RLS already restricts
 * rows to the owner; we also scope every query by `user_id`.
 *
 * Seeding strategy (see `saveTranscriptSegments` / `saveScenes` / `saveCaptions`):
 * REPLACE — delete the project's existing rows, then insert the latest set. This
 * keeps mock-analysis re-runs from duplicating data. Never uses the admin client.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import type { Scene, TranscriptLine, Caption } from '@/lib/types'
import {
  mapProviderScenesToInsert,
  mapProviderTranscriptToInsert,
  mapProviderCaptionsToInsert,
  computeDurationSeconds,
  type DbDraftInput,
} from '@/lib/mappers/create-flow.mapper'

type ProjectRow = Database['public']['Tables']['projects']['Row']

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

export interface ProjectSettingsInput {
  title?: string
  language?: string
  storyStyle?: string
  visualSource?: string
  captionStyle?: string
}

/**
 * Load everything needed to hydrate the provider for a project. Returns `null`
 * if the project doesn't exist or isn't owned by the current user.
 */
export async function getCreateFlowDraft(projectId: string): Promise<DbDraftInput | null> {
  const { supabase, user } = await getAuthedContext()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !project) return null

  const [segmentsRes, scenesRes, captionsRes, exportRes, audioRes] = await Promise.all([
    supabase
      .from('transcript_segments')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('segment_index', { ascending: true }),
    supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('scene_index', { ascending: true }),
    supabase
      .from('captions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('caption_index', { ascending: true }),
    supabase
      .from('exports')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('audio_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    project,
    segments: segmentsRes.data ?? [],
    scenes: scenesRes.data ?? [],
    captions: captionsRes.data ?? [],
    exportRow: exportRes.data ?? null,
    audio: audioRes.data ?? null,
  }
}

/** Persist the project's top-level settings. */
export async function updateProjectSettings(
  projectId: string,
  input: ProjectSettingsInput
): Promise<void> {
  const { supabase, user } = await getAuthedContext()

  const patch: Partial<ProjectRow> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.language !== undefined) patch.language = input.language
  if (input.storyStyle !== undefined) patch.story_style = input.storyStyle
  if (input.visualSource !== undefined) patch.visual_source = input.visualSource
  if (input.captionStyle !== undefined) patch.caption_style = input.captionStyle
  if (Object.keys(patch).length === 0) return

  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`[create-flow.service] updateProjectSettings failed: ${error.message}`)
  }
}

/** REPLACE the project's transcript segments. */
export async function saveTranscriptSegments(
  projectId: string,
  transcript: TranscriptLine[]
): Promise<void> {
  const { supabase, user } = await getAuthedContext()

  const del = await supabase
    .from('transcript_segments')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) {
    throw new Error(`[create-flow.service] clear transcript failed: ${del.error.message}`)
  }

  if (transcript.length === 0) return
  const rows = mapProviderTranscriptToInsert(transcript, projectId, user.id)
  const { error } = await supabase.from('transcript_segments').insert(rows)
  if (error) {
    throw new Error(`[create-flow.service] insert transcript failed: ${error.message}`)
  }
}

/** REPLACE the project's scenes and refresh `total_scenes` / `duration_seconds`. */
export async function saveScenes(projectId: string, scenes: Scene[]): Promise<void> {
  const { supabase, user } = await getAuthedContext()

  const del = await supabase
    .from('scenes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) {
    throw new Error(`[create-flow.service] clear scenes failed: ${del.error.message}`)
  }

  if (scenes.length > 0) {
    const rows = mapProviderScenesToInsert(scenes, projectId, user.id)
    const { error } = await supabase.from('scenes').insert(rows)
    if (error) {
      throw new Error(`[create-flow.service] insert scenes failed: ${error.message}`)
    }
  }

  // Keep the project summary in sync so dashboard/projects show real numbers.
  await supabase
    .from('projects')
    .update({
      total_scenes: scenes.length,
      duration_seconds: computeDurationSeconds(scenes),
    })
    .eq('id', projectId)
    .eq('user_id', user.id)
}

/** REPLACE the project's captions. */
export async function saveCaptions(projectId: string, captions: Caption[]): Promise<void> {
  const { supabase, user } = await getAuthedContext()

  const del = await supabase
    .from('captions')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) {
    throw new Error(`[create-flow.service] clear captions failed: ${del.error.message}`)
  }

  if (captions.length === 0) return
  const rows = mapProviderCaptionsToInsert(captions, projectId, user.id)
  const { error } = await supabase.from('captions').insert(rows)
  if (error) {
    throw new Error(`[create-flow.service] insert captions failed: ${error.message}`)
  }
}

/** The latest export row for the project, or `null`. */
export async function getProjectExport(projectId: string) {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('exports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}
