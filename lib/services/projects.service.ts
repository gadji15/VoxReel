import 'server-only'

/**
 * VoxReel — projects service (SERVER-ONLY)
 *
 * The first real persistence layer: reads/writes the current user's `projects`
 * rows via the session-aware Supabase server client. RLS already restricts rows
 * to the owner; we also filter by `user_id` explicitly for clarity.
 *
 * Scope: projects only. No audio/transcription/scenes/render here yet.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'

export type ProjectRow = Database['public']['Tables']['projects']['Row']

/** Defaults for a new draft — mirror the CreateFlowProvider mock defaults. */
const NEW_PROJECT_DEFAULTS = {
  title: 'Untitled Reel',
  language: 'English',
  story_style: 'noir',
  visual_source: 'stock',
  caption_style: 'bold-center',
  status: 'draft',
} as const

/** Resolve the signed-in user + a server client, or redirect to /login. */
async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

export interface CreateProjectInput {
  title?: string
  storyStyle?: string
  language?: string
  visualSource?: string
  captionStyle?: string
}

/** All of the current user's non-archived projects, newest first. */
export async function getCurrentUserProjects(): Promise<ProjectRow[]> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[projects.service] getCurrentUserProjects failed:', error.message)
    return []
  }
  return data ?? []
}

/** The most recent N projects for the dashboard. */
export async function getRecentProjects(limit = 3): Promise<ProjectRow[]> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[projects.service] getRecentProjects failed:', error.message)
    return []
  }
  return data ?? []
}

/** A single project by id (scoped to the current user), or `null`. */
export async function getProjectById(projectId: string): Promise<ProjectRow | null> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[projects.service] getProjectById failed:', error.message)
    return null
  }
  return data
}

/** Create a new draft project for the current user and return the row. */
export async function createProject(input: CreateProjectInput = {}): Promise<ProjectRow> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: input.title ?? NEW_PROJECT_DEFAULTS.title,
      status: NEW_PROJECT_DEFAULTS.status,
      language: input.language ?? NEW_PROJECT_DEFAULTS.language,
      story_style: input.storyStyle ?? NEW_PROJECT_DEFAULTS.story_style,
      visual_source: input.visualSource ?? NEW_PROJECT_DEFAULTS.visual_source,
      caption_style: input.captionStyle ?? NEW_PROJECT_DEFAULTS.caption_style,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`[projects.service] createProject failed: ${error?.message ?? 'no row'}`)
  }
  return data
}

/** Soft-delete: mark a project archived (kept in DB). */
export async function archiveProject(projectId: string): Promise<void> {
  const { supabase, user } = await getAuthedContext()
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`[projects.service] archiveProject failed: ${error.message}`)
  }
}

/** Hard-delete a project (cascades to its child rows via FK on delete cascade). */
export async function deleteProject(projectId: string): Promise<void> {
  const { supabase, user } = await getAuthedContext()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`[projects.service] deleteProject failed: ${error.message}`)
  }
}
