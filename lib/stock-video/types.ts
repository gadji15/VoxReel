/**
 * VoxReel — stock-video types
 *
 * Shared shapes for searching Pexels/Pixabay and persisting `clip_candidates` /
 * `selected_clips`. Provider clients normalize their raw API responses into
 * `StockVideoCandidate`; `scoring.ts` fills `matchScore` + `reason`.
 */

export type StockVideoProvider = 'pexels' | 'pixabay'

export type ClipOrientation = 'portrait' | 'landscape' | 'square'

/** A normalized stock-video candidate (provider-agnostic). */
export interface StockVideoCandidate {
  provider: StockVideoProvider
  providerClipId: string
  title: string
  description: string
  thumbnailUrl: string | null
  previewUrl: string | null
  downloadUrl: string | null
  durationSeconds: number | null
  width: number | null
  height: number | null
  orientation: ClipOrientation | null
  /** 0–100, filled by the scoring helper. */
  matchScore: number
  /** Short, honest explanation of the score. */
  reason: string
  license: string | null
  authorName: string | null
  authorUrl: string | null
  metadata: Record<string, unknown>
}

/** Inputs used to build a provider query for one scene. */
export interface StockVideoSearchInput {
  query: string
  visualIntent?: string
  emotion?: string
  sceneDurationSeconds?: number
  /** Max results to request per provider (MVP: ~6–10). */
  perProvider?: number
}

/** A provider's normalized results for one query. */
export interface NormalizedStockVideoResult {
  provider: StockVideoProvider
  candidates: StockVideoCandidate[]
}

/** Explainable breakdown of a candidate's score. */
export interface ClipMatchScoreBreakdown {
  base: number
  orientation: number
  duration: number
  resolution: number
  total: number
}

/**
 * Serializable, UI-facing view of a saved `clip_candidates` row (used by the
 * Replace Clip flow). No secrets.
 */
export interface ClipCandidateView {
  id: string
  provider: string
  title: string
  thumbnailUrl: string | null
  previewUrl: string | null
  sourceUrl: string | null
  matchScore: number
  durationSeconds: number | null
  orientation: string | null
  reason: string | null
}
