/**
 * VoxReel — project mapper
 *
 * Maps a Supabase `projects` row into the UI `Project` shape consumed by
 * `ProjectCard` / dashboard / projects screens.
 *
 * Honesty rules for real DB rows:
 *  - `views` is always `null` (we do NOT fabricate viral numbers).
 *  - `platform` falls back to a neutral default unless stored in metadata.
 *  - `status` reflects the database value (mapped to the UI's 3 states).
 *
 * Pure function — safe to import anywhere (no secrets, no client/server bias).
 */

import type { Project, ProjectStatus, Platform } from '@/lib/types'
import type { Database, Json } from '@/lib/supabase/database.types'

export type ProjectRow = Database['public']['Tables']['projects']['Row']

/** Format a duration in seconds as `m:ss`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds || 0))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Human-readable relative time (e.g. `2 hours ago`). */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

/** Map a free-text DB status to the UI's 3 supported states. */
function mapStatus(dbStatus: string): ProjectStatus {
  switch (dbStatus) {
    case 'complete':
    case 'rendering':
    case 'draft':
      return dbStatus
    case 'published':
    case 'exported':
      return 'complete'
    default:
      return 'draft'
  }
}

/** Read an optional `platform` from the row metadata, else a neutral default. */
function mapPlatform(metadata: Json): Platform {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const p = (metadata as Record<string, unknown>).platform
    if (p === 'tiktok' || p === 'instagram' || p === 'youtube') return p
  }
  return 'tiktok'
}

/** Map a single DB project row to the UI `Project` shape. */
export function mapProjectRowToUi(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    duration: formatDuration(row.duration_seconds),
    scenes: row.total_scenes,
    status: mapStatus(row.status),
    thumbnail: row.thumbnail_path ?? null,
    createdAt: formatRelativeTime(row.created_at),
    platform: mapPlatform(row.metadata),
    // Real DB projects don't have analytics yet — never fabricate view counts.
    views: null,
  }
}

/** Map a list of DB project rows to UI projects. */
export function mapProjectRowsToUi(rows: ProjectRow[]): Project[] {
  return rows.map(mapProjectRowToUi)
}
