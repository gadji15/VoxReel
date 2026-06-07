/**
 * VoxReel — clip cache types
 *
 * Shapes for downloading each scene's selected stock clip and caching it in the
 * private `video-clips-cache` bucket, ready for the future renderer.
 */

export type ClipCacheStatus =
  | 'cached' // downloaded + uploaded to storage
  | 'skipped' // already cached / nothing to do
  | 'no_source' // no provider URL to download
  | 'too_large' // exceeded the size cap
  | 'failed' // download/upload error

/** Per-clip caching outcome (serializable). */
export interface ClipCacheResult {
  selectedClipId: string
  sceneId: string
  status: ClipCacheStatus
  storageBucket?: string | null
  storagePath?: string | null
  error?: string
}

/** Aggregate result for a project caching run. */
export interface ProjectClipCacheResult {
  ok: boolean
  cached: number
  skipped: number
  failed: number
  results: ClipCacheResult[]
  error?: string
}

/** A cached selected clip (for reads). */
export interface CachedSelectedClip {
  selectedClipId: string
  sceneId: string
  sourceUrl: string | null
  storageBucket: string | null
  storagePath: string | null
}

export interface ClipCacheInput {
  selectedClipId: string
}
