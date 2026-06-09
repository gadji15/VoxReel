import 'server-only'

/**
 * VoxReel — render queue service (SERVER-ONLY, session/web side)
 *
 * The web path: create a `queued` render job for the current user's project and
 * read job status. Does NOT run FFmpeg — the worker
 * (`render-worker.service.ts`) claims and processes queued jobs. Uses the
 * session client (RLS); never the admin/service role.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import { RENDER_WIDTH, RENDER_HEIGHT, RENDER_FPS } from '@/lib/render/timeline'

export type RenderJobRow = Database['public']['Tables']['render_jobs']['Row']

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

/**
 * Enqueue a render for the project. If a job is already `queued` or `processing`
 * for this project, returns that one instead of creating a duplicate.
 */
export async function enqueueRenderProject(projectId: string): Promise<RenderJobRow> {
  const { supabase, user } = await getAuthedContext()

  // Ownership + scenes sanity (so we don't queue an empty project).
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) throw new Error('Project not found.')

  const { count: sceneCount } = await supabase
    .from('scenes')
    .select('id', { head: true, count: 'exact' })
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (!sceneCount || sceneCount === 0) {
    throw new Error('No scenes to render. Run analysis first.')
  }

  // Reuse an in-flight job instead of duplicating.
  const { data: existing } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .in('status', ['queued', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('render_jobs')
    .insert({
      project_id: projectId,
      user_id: user.id,
      status: 'queued',
      progress: 0,
      current_step: 'Queued for rendering',
      resolution_width: RENDER_WIDTH,
      resolution_height: RENDER_HEIGHT,
      fps: RENDER_FPS,
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`[render-queue] enqueue failed: ${error?.message ?? 'no row'}`)
  }
  return data
}

/** The latest render job for a project (owner-scoped). */
export async function getLatestRenderJobForProject(projectId: string): Promise<RenderJobRow | null> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

/** A render job by id (owner-scoped). */
export async function getRenderJobById(jobId: string): Promise<RenderJobRow | null> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .maybeSingle()
  return data ?? null
}
