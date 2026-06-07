/**
 * VoxReel — stock-video scoring
 *
 * Simple, explainable 0–100 score for how well a candidate fits a 9:16 reel
 * scene. We cannot truly measure *semantic* relevance here (no embeddings), so
 * the score reflects technical fit (orientation, duration, resolution) and the
 * `reason` is honest about that.
 */

import type {
  StockVideoCandidate,
  ClipMatchScoreBreakdown,
  StockVideoSearchInput,
} from './types'

export interface ScoreResult {
  matchScore: number
  reason: string
  breakdown: ClipMatchScoreBreakdown
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * Score a candidate against a scene's needs. Returns a 0–100 score, a short
 * human reason, and the component breakdown.
 */
export function scoreStockCandidate(
  candidate: StockVideoCandidate,
  input: Pick<StockVideoSearchInput, 'sceneDurationSeconds'>
): ScoreResult {
  // Base: the provider returned it for our query, but relevance is unverified.
  const base = 50

  // Orientation — strongly prefer vertical for 9:16.
  let orientation = 0
  let orientationLabel = 'unknown orientation'
  if (candidate.orientation === 'portrait') {
    orientation = 22
    orientationLabel = 'vertical 9:16-friendly'
  } else if (candidate.orientation === 'square') {
    orientation = 8
    orientationLabel = 'square (some cropping)'
  } else if (candidate.orientation === 'landscape') {
    orientation = 0
    orientationLabel = 'landscape (needs cropping)'
  }

  // Duration closeness to the scene length.
  let duration = 5
  let durationLabel = 'duration unknown'
  if (candidate.durationSeconds != null && input.sceneDurationSeconds != null) {
    const diff = Math.abs(candidate.durationSeconds - input.sceneDurationSeconds)
    duration = clamp(15 - diff * 1.5, 0, 15)
    durationLabel = `~${Math.round(candidate.durationSeconds)}s clip`
  } else if (candidate.durationSeconds != null) {
    duration = 6
    durationLabel = `~${Math.round(candidate.durationSeconds)}s clip`
  }

  // Resolution quality (taller is better for vertical).
  let resolution = 2
  let resolutionLabel = 'low resolution'
  const longEdge = Math.max(candidate.width ?? 0, candidate.height ?? 0)
  if (longEdge >= 1920) {
    resolution = 12
    resolutionLabel = 'high resolution'
  } else if (longEdge >= 1280) {
    resolution = 8
    resolutionLabel = 'HD resolution'
  } else if (longEdge >= 720) {
    resolution = 5
    resolutionLabel = 'SD resolution'
  }

  const total = Math.round(clamp(base + orientation + duration + resolution, 0, 100))

  const reason = `${orientationLabel}, ${resolutionLabel}, ${durationLabel} (relevance approximate)`

  return {
    matchScore: total,
    reason,
    breakdown: { base, orientation, duration: Math.round(duration), resolution, total },
  }
}
