import 'server-only'

/**
 * VoxReel — Pexels video provider (SERVER-ONLY)
 *
 * Calls the Pexels Videos API server-side and normalizes results to
 * `StockVideoCandidate`. Never imported by client components; the API key is
 * read from env only here. Prefers portrait/vertical clips for 9:16 reels.
 */

import { getStockVideoEnv } from '@/lib/supabase/env'
import type { StockVideoCandidate, ClipOrientation } from './types'

const PEXELS_ENDPOINT = 'https://api.pexels.com/videos/search'
const TIMEOUT_MS = 8000

interface PexelsVideoFile {
  link: string
  quality: string | null
  width: number | null
  height: number | null
  file_type: string | null
}
interface PexelsVideo {
  id: number
  width: number
  height: number
  duration: number
  url: string
  image: string
  user?: { name?: string; url?: string }
  video_files: PexelsVideoFile[]
}
interface PexelsResponse {
  videos?: PexelsVideo[]
}

function orientationOf(width: number, height: number): ClipOrientation {
  if (height > width) return 'portrait'
  if (width > height) return 'landscape'
  return 'square'
}

/** Derive a readable title from a Pexels page URL slug. */
function titleFromUrl(url: string, id: number): string {
  try {
    const seg = url.split('/').filter(Boolean).pop() ?? ''
    const words = seg.replace(/-\d+$/, '').replace(/-/g, ' ').trim()
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : `Pexels clip ${id}`
  } catch {
    return `Pexels clip ${id}`
  }
}

/** Pick a preview (smaller) and download (best) link, preferring portrait. */
function pickFiles(files: PexelsVideoFile[]): {
  preview: PexelsVideoFile | null
  best: PexelsVideoFile | null
} {
  const valid = files.filter((f) => !!f.link)
  if (valid.length === 0) return { preview: null, best: null }
  const byArea = [...valid].sort(
    (a, b) => (a.width ?? 0) * (a.height ?? 0) - (b.width ?? 0) * (b.height ?? 0)
  )
  const preview = byArea.find((f) => (f.height ?? 0) >= 540) ?? byArea[0]
  const best = byArea[byArea.length - 1]
  return { preview, best }
}

export async function searchPexelsVideos(
  query: string,
  perPage = 8
): Promise<StockVideoCandidate[]> {
  const { pexelsApiKey } = getStockVideoEnv()
  if (!pexelsApiKey) return []

  const params = new URLSearchParams({
    query,
    per_page: String(Math.max(1, Math.min(perPage, 20))),
    orientation: 'portrait',
    size: 'medium',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${PEXELS_ENDPOINT}?${params.toString()}`, {
      headers: { Authorization: pexelsApiKey },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      // Don't leak the key; surface a generic, safe message upstream.
      throw new Error(`Pexels request failed (${res.status}).`)
    }
    const data = (await res.json()) as PexelsResponse
    const videos = data.videos ?? []

    return videos.map((v) => {
      const { preview, best } = pickFiles(v.video_files)
      const width = best?.width ?? v.width
      const height = best?.height ?? v.height
      return {
        provider: 'pexels' as const,
        providerClipId: String(v.id),
        title: titleFromUrl(v.url, v.id),
        description: '',
        thumbnailUrl: v.image ?? null,
        previewUrl: preview?.link ?? null,
        downloadUrl: best?.link ?? null,
        durationSeconds: v.duration ?? null,
        width: width ?? null,
        height: height ?? null,
        orientation: orientationOf(width, height),
        matchScore: 0,
        reason: '',
        license: 'Pexels',
        authorName: v.user?.name ?? null,
        authorUrl: v.user?.url ?? null,
        metadata: { pageUrl: v.url },
      }
    })
  } finally {
    clearTimeout(timer)
  }
}
