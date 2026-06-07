import 'server-only'

/**
 * VoxReel — Pixabay video provider (SERVER-ONLY)
 *
 * Calls the Pixabay Videos API server-side and normalizes results to
 * `StockVideoCandidate`. Never imported by client components; the API key is
 * read from env only here. Pixabay has no portrait filter, so vertical clips are
 * favored later by the scoring step.
 */

import { getStockVideoEnv } from '@/lib/supabase/env'
import type { StockVideoCandidate, ClipOrientation } from './types'

const PIXABAY_ENDPOINT = 'https://pixabay.com/api/videos/'
const TIMEOUT_MS = 8000

interface PixabayVideoSize {
  url?: string
  width?: number
  height?: number
  size?: number
  thumbnail?: string
}
interface PixabayHit {
  id: number
  pageURL?: string
  duration?: number
  tags?: string
  user?: string
  videos?: {
    large?: PixabayVideoSize
    medium?: PixabayVideoSize
    small?: PixabayVideoSize
    tiny?: PixabayVideoSize
  }
}
interface PixabayResponse {
  hits?: PixabayHit[]
}

function orientationOf(width: number, height: number): ClipOrientation | null {
  if (!width || !height) return null
  if (height > width) return 'portrait'
  if (width > height) return 'landscape'
  return 'square'
}

function titleFromTags(tags: string | undefined, id: number): string {
  const first = (tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(', ')
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : `Pixabay clip ${id}`
}

export async function searchPixabayVideos(
  query: string,
  perPage = 8
): Promise<StockVideoCandidate[]> {
  const { pixabayApiKey } = getStockVideoEnv()
  if (!pixabayApiKey) return []

  const params = new URLSearchParams({
    key: pixabayApiKey,
    q: query,
    // Pixabay requires per_page between 3 and 200.
    per_page: String(Math.max(3, Math.min(perPage, 50))),
    video_type: 'film',
    safesearch: 'true',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${PIXABAY_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Pixabay request failed (${res.status}).`)
    }
    const data = (await res.json()) as PixabayResponse
    const hits = data.hits ?? []

    return hits.map((h) => {
      const sizes = h.videos ?? {}
      const best = sizes.large ?? sizes.medium ?? sizes.small ?? sizes.tiny ?? {}
      const preview = sizes.small ?? sizes.tiny ?? sizes.medium ?? best
      const width = best.width ?? 0
      const height = best.height ?? 0
      return {
        provider: 'pixabay' as const,
        providerClipId: String(h.id),
        title: titleFromTags(h.tags, h.id),
        description: h.tags ?? '',
        thumbnailUrl: best.thumbnail ?? preview.thumbnail ?? null,
        previewUrl: preview.url ?? null,
        downloadUrl: best.url ?? null,
        durationSeconds: h.duration ?? null,
        width: width || null,
        height: height || null,
        orientation: orientationOf(width, height),
        matchScore: 0,
        reason: '',
        license: 'Pixabay',
        authorName: h.user ?? null,
        authorUrl: h.pageURL ?? null,
        metadata: { pageUrl: h.pageURL ?? null },
      }
    })
  } finally {
    clearTimeout(timer)
  }
}
