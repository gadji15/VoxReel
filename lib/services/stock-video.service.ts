import 'server-only'

/**
 * VoxReel — stock-video service (SERVER-ONLY)
 *
 * For each scene, queries available stock providers (Pexels/Pixabay) using the
 * scene's `search_query`, scores + ranks candidates, REPLACES the scene's
 * `clip_candidates`, and picks the best into `selected_clips`. Provider keys are
 * server-only; never uses the admin/service-role client.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getStockVideoEnv } from '@/lib/supabase/env'
import { ROUTES } from '@/lib/routes'
import type { Database, Json } from '@/lib/supabase/database.types'
import type { Scene } from '@/lib/types'
import { mapSceneRowToProvider } from '@/lib/mappers/create-flow.mapper'
import { searchPexelsVideos } from '@/lib/stock-video/pexels'
import { searchPixabayVideos } from '@/lib/stock-video/pixabay'
import { scoreStockCandidate } from '@/lib/stock-video/scoring'
import type {
  StockVideoProvider,
  StockVideoCandidate,
  ClipCandidateView,
} from '@/lib/stock-video/types'

type SceneRow = Database['public']['Tables']['scenes']['Row']
type ClipCandidateRow = Database['public']['Tables']['clip_candidates']['Row']
type SelectedClipRow = Database['public']['Tables']['selected_clips']['Row']

export const STATUS_CLIPS_READY = 'clips_ready'

const PER_PROVIDER = 6
const TOP_CANDIDATES = 8

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

/** Which providers have keys configured (server-side). */
export function getAvailableStockProviders(): StockVideoProvider[] {
  const { pexelsApiKey, pixabayApiKey } = getStockVideoEnv()
  const providers: StockVideoProvider[] = []
  if (pexelsApiKey) providers.push('pexels')
  if (pixabayApiKey) providers.push('pixabay')
  return providers
}

function buildSceneQuery(scene: SceneRow): string {
  const q = (scene.search_query ?? '').trim()
  if (q) return q.split(/\s+/).slice(0, 12).join(' ')
  const vi = (scene.visual_intent ?? '').trim()
  if (vi) return vi.split(/\s+/).slice(0, 8).join(' ')
  return (scene.emotion ?? 'cinematic dark mood').toString()
}

/** Run all available providers for one query and return raw candidates. */
async function fetchCandidates(
  query: string,
  providers: StockVideoProvider[]
): Promise<StockVideoCandidate[]> {
  const all: StockVideoCandidate[] = []
  for (const provider of providers) {
    try {
      const cands =
        provider === 'pexels'
          ? await searchPexelsVideos(query, PER_PROVIDER)
          : await searchPixabayVideos(query, PER_PROVIDER)
      all.push(...cands)
    } catch {
      // One provider failing shouldn't abort the scene — try the others.
    }
  }
  return all
}

/** REPLACE a scene's clip_candidates and return the inserted rows. */
export async function saveClipCandidates(
  projectId: string,
  sceneId: string,
  candidates: StockVideoCandidate[]
): Promise<ClipCandidateRow[]> {
  const { supabase, user } = await getAuthedContext()

  const del = await supabase
    .from('clip_candidates')
    .delete()
    .eq('project_id', projectId)
    .eq('scene_id', sceneId)
    .eq('user_id', user.id)
  if (del.error) throw new Error(`Failed to clear old clips: ${del.error.message}`)

  if (candidates.length === 0) return []

  const rows = candidates.map((c) => ({
    project_id: projectId,
    scene_id: sceneId,
    user_id: user.id,
    provider: c.provider,
    provider_clip_id: c.providerClipId,
    title: c.title,
    description: c.description,
    thumbnail_url: c.thumbnailUrl,
    preview_url: c.previewUrl,
    download_url: c.downloadUrl,
    duration_seconds: c.durationSeconds,
    width: c.width,
    height: c.height,
    orientation: c.orientation,
    match_score: Math.min(100, Math.max(0, Math.round(c.matchScore))),
    reason: c.reason,
    license: c.license,
    author_name: c.authorName,
    author_url: c.authorUrl,
    metadata: c.metadata as unknown as Json,
  }))

  const { data, error } = await supabase.from('clip_candidates').insert(rows).select('*')
  if (error) throw new Error(`Failed to save clips: ${error.message}`)
  return data ?? []
}

/** Write/replace the selected_clips row for a scene from a candidate row. */
async function writeSelectedClip(
  projectId: string,
  sceneId: string,
  candidate: ClipCandidateRow
): Promise<void> {
  const { supabase, user } = await getAuthedContext()

  await supabase
    .from('selected_clips')
    .delete()
    .eq('project_id', projectId)
    .eq('scene_id', sceneId)
    .eq('user_id', user.id)

  const { error } = await supabase.from('selected_clips').insert({
    project_id: projectId,
    scene_id: sceneId,
    user_id: user.id,
    clip_candidate_id: candidate.id,
    provider: candidate.provider,
    source_url: candidate.download_url ?? candidate.preview_url,
    metadata: {
      title: candidate.title,
      description: candidate.description,
      thumbnailUrl: candidate.thumbnail_url,
      previewUrl: candidate.preview_url,
      sourceUrl: candidate.download_url ?? candidate.preview_url,
      matchScore: candidate.match_score,
      provider: candidate.provider,
      durationSeconds: candidate.duration_seconds,
      orientation: candidate.orientation,
      reason: candidate.reason,
    } as unknown as Json,
  })
  if (error) throw new Error(`Failed to select clip: ${error.message}`)
}

/** Provider scenes for a project, hydrated with their selected clip. */
export async function getScenesWithSelectedClips(projectId: string): Promise<Scene[]> {
  const { supabase, user } = await getAuthedContext()
  const [scenesRes, selectedRes] = await Promise.all([
    supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('scene_index', { ascending: true }),
    supabase
      .from('selected_clips')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id),
  ])
  const rows = scenesRes.data ?? []
  const selectedByScene = new Map<string, SelectedClipRow>(
    (selectedRes.data ?? []).map((s) => [s.scene_id, s])
  )
  return rows.map((r) => mapSceneRowToProvider(r, rows.length, selectedByScene.get(r.id)))
}

/** Search + persist candidates + select best, for every scene in the project. */
export async function searchStockVideosForProject(
  projectId: string
): Promise<{ scenes: Scene[]; clipsSelected: number; providers: StockVideoProvider[] }> {
  const { supabase, user } = await getAuthedContext()
  const providers = getAvailableStockProviders()
  if (providers.length === 0) {
    throw new Error(
      'No stock-video provider configured. Add PEXELS_API_KEY or PIXABAY_API_KEY.'
    )
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) throw new Error('Project not found.')

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('scene_index', { ascending: true })

  const sceneRows = scenes ?? []
  let clipsSelected = 0

  for (const scene of sceneRows) {
    const query = buildSceneQuery(scene)
    const duration = scene.end_time_seconds - scene.start_time_seconds
    const raw = await fetchCandidates(query, providers)
    const scored = raw
      .map((c) => {
        const s = scoreStockCandidate(c, { sceneDurationSeconds: duration })
        return { ...c, matchScore: s.matchScore, reason: s.reason }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, TOP_CANDIDATES)

    const inserted = await saveClipCandidates(projectId, scene.id, scored)
    if (inserted.length > 0) {
      await writeSelectedClip(projectId, scene.id, inserted[0])
      clipsSelected += 1
    }
  }

  if (clipsSelected > 0) {
    await supabase
      .from('projects')
      .update({ status: STATUS_CLIPS_READY })
      .eq('id', projectId)
      .eq('user_id', user.id)
  }

  const hydrated = await getScenesWithSelectedClips(projectId)
  return { scenes: hydrated, clipsSelected, providers }
}

/** Search + persist for a single scene; returns saved candidate count. */
export async function searchStockVideosForScene(
  projectId: string,
  sceneId: string
): Promise<number> {
  const { supabase, user } = await getAuthedContext()
  const providers = getAvailableStockProviders()
  if (providers.length === 0) {
    throw new Error(
      'No stock-video provider configured. Add PEXELS_API_KEY or PIXABAY_API_KEY.'
    )
  }

  const { data: scene } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!scene) throw new Error('Scene not found.')

  const query = buildSceneQuery(scene)
  const duration = scene.end_time_seconds - scene.start_time_seconds
  const raw = await fetchCandidates(query, providers)
  const scored = raw
    .map((c) => {
      const s = scoreStockCandidate(c, { sceneDurationSeconds: duration })
      return { ...c, matchScore: s.matchScore, reason: s.reason }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, TOP_CANDIDATES)

  const inserted = await saveClipCandidates(projectId, sceneId, scored)
  if (inserted.length > 0) {
    await writeSelectedClip(projectId, sceneId, inserted[0])
  }
  return inserted.length
}

/** Saved candidates for a scene (UI view), ranked by score. */
export async function getClipCandidatesForScene(
  projectId: string,
  sceneId: string
): Promise<ClipCandidateView[]> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('clip_candidates')
    .select('*')
    .eq('project_id', projectId)
    .eq('scene_id', sceneId)
    .eq('user_id', user.id)
    .order('match_score', { ascending: false })

  return (data ?? []).map((c) => ({
    id: c.id,
    provider: c.provider ?? 'unknown',
    title: c.title ?? 'Stock clip',
    thumbnailUrl: c.thumbnail_url,
    previewUrl: c.preview_url,
    sourceUrl: c.download_url ?? c.preview_url,
    matchScore: c.match_score ?? 0,
    durationSeconds: c.duration_seconds,
    orientation: c.orientation,
    reason: c.reason,
  }))
}

/** Choose a specific candidate as the scene's selected clip. */
export async function selectClipCandidate(
  projectId: string,
  sceneId: string,
  clipCandidateId: string
): Promise<void> {
  const { supabase, user } = await getAuthedContext()
  const { data: candidate } = await supabase
    .from('clip_candidates')
    .select('*')
    .eq('id', clipCandidateId)
    .eq('project_id', projectId)
    .eq('scene_id', sceneId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!candidate) throw new Error('Clip candidate not found.')
  await writeSelectedClip(projectId, sceneId, candidate)
}
