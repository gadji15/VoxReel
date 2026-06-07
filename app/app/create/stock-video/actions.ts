'use server'

/**
 * VoxReel — stock-video server actions
 *
 * Server-only entry points for stock-video search + clip selection. They run the
 * service, return clean serializable results, and never expose provider keys.
 */

import {
  searchStockVideosForProject,
  searchStockVideosForScene,
  getClipCandidatesForScene,
  selectClipCandidate,
  getAvailableStockProviders,
} from '@/lib/services/stock-video.service'
import type { Scene } from '@/lib/types'
import type { ClipCandidateView } from '@/lib/stock-video/types'

export interface StockSearchResult {
  ok: boolean
  scenes: Scene[]
  clipsSelected: number
  /** True when no provider key is configured (a soft, non-fatal condition). */
  noProvider: boolean
  error?: string
}

/** Search stock video for every scene and return clip-hydrated scenes. */
export async function searchStockVideosForProjectAction(
  projectId: string
): Promise<StockSearchResult> {
  if (getAvailableStockProviders().length === 0) {
    return {
      ok: false,
      scenes: [],
      clipsSelected: 0,
      noProvider: true,
      error: 'No stock-video provider configured (PEXELS_API_KEY / PIXABAY_API_KEY).',
    }
  }
  try {
    const { scenes, clipsSelected } = await searchStockVideosForProject(projectId)
    return { ok: true, scenes, clipsSelected, noProvider: false }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Stock video search failed.'
    return { ok: false, scenes: [], clipsSelected: 0, noProvider: false, error }
  }
}

/** Search stock video for one scene; returns the number of candidates saved. */
export async function searchStockVideosForSceneAction(
  projectId: string,
  sceneId: string
): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const count = await searchStockVideosForScene(projectId, sceneId)
    return { ok: true, count }
  } catch (err) {
    return { ok: false, count: 0, error: err instanceof Error ? err.message : 'Search failed.' }
  }
}

/** Saved candidates for a scene (ranked) for the Replace Clip UI. */
export async function getClipCandidatesForSceneAction(
  projectId: string,
  sceneId: string
): Promise<ClipCandidateView[]> {
  return getClipCandidatesForScene(projectId, sceneId)
}

/** Persist the user's chosen candidate as the scene's selected clip. */
export async function selectClipCandidateAction(
  projectId: string,
  sceneId: string,
  clipCandidateId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await selectClipCandidate(projectId, sceneId, clipCandidateId)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not select clip.' }
  }
}
