import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/project-flow?projectId=<uuid>
 *
 * Developer diagnostic: how far a project has progressed through the real
 * pipeline. Returns row COUNTS per table for the CURRENT USER's project (RLS +
 * explicit `user_id` scope — never another user's data, no secrets, no file URLs).
 *
 * Use it to confirm each step actually wrote rows:
 *   audio_files → transcript_segments → scenes → clip_candidates →
 *   selected_clips → render_jobs → exports.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CountTable =
  | 'audio_files'
  | 'transcript_segments'
  | 'scenes'
  | 'clip_candidates'
  | 'selected_clips'
  | 'render_jobs'
  | 'exports'

export async function GET(request: Request) {
  const timestamp = new Date().toISOString()
  const projectId = new URL(request.url).searchParams.get('projectId')

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated.', timestamp }, { status: 401 })
  }
  if (!projectId) {
    return NextResponse.json({ ok: false, error: 'Missing projectId.', timestamp }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  const countFor = async (table: CountTable): Promise<number> => {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    return count ?? 0
  }

  const [audio_files, transcript_segments, scenes, clip_candidates, selected_clips, render_jobs, exports] =
    await Promise.all([
      countFor('audio_files'),
      countFor('transcript_segments'),
      countFor('scenes'),
      countFor('clip_candidates'),
      countFor('selected_clips'),
      countFor('render_jobs'),
      countFor('exports'),
    ])

  return NextResponse.json({
    ok: true,
    projectId,
    projectExists: Boolean(project),
    projectStatus: project?.status ?? null,
    counts: {
      audio_files,
      transcript_segments,
      scenes,
      clip_candidates,
      selected_clips,
      render_jobs,
      exports,
    },
    timestamp,
  })
}
