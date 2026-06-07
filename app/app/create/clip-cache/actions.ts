'use server'

/**
 * VoxReel — clip cache server actions
 *
 * Server-only entry points for caching selected stock clips into the private
 * `video-clips-cache` bucket. Return clean serializable results; never expose
 * secrets or provider keys.
 */

import {
  cacheSelectedClipsForProject,
  cacheSelectedClip,
  getCachedSelectedClips,
} from '@/lib/services/clip-cache.service'
import type {
  ProjectClipCacheResult,
  ClipCacheResult,
  CachedSelectedClip,
} from '@/lib/clip-cache/types'

/** Cache all selected clips for a project. */
export async function cacheSelectedClipsForProjectAction(
  projectId: string
): Promise<ProjectClipCacheResult> {
  try {
    return await cacheSelectedClipsForProject(projectId)
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Clip caching failed.'
    return { ok: false, cached: 0, skipped: 0, failed: 0, results: [], error }
  }
}

/** Cache a single selected clip. */
export async function cacheSelectedClipAction(
  projectId: string,
  selectedClipId: string
): Promise<ClipCacheResult> {
  try {
    return await cacheSelectedClip(projectId, selectedClipId)
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Clip caching failed.'
    return { selectedClipId, sceneId: '', status: 'failed', error }
  }
}

/** Read cached-clip info for a project. */
export async function getCachedSelectedClipsAction(
  projectId: string
): Promise<CachedSelectedClip[]> {
  return getCachedSelectedClips(projectId)
}
