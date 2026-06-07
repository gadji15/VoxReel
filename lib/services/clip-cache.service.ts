import 'server-only'

/**
 * VoxReel — clip cache service (SERVER-ONLY)
 *
 * Downloads each scene's selected stock clip from its provider URL (server-side)
 * and caches it in the private `video-clips-cache` bucket, recording
 * `storage_bucket`/`storage_path` on the `selected_clips` row. `source_url` is
 * kept unchanged. Idempotent (upsert by deterministic path). Never uses the
 * admin/service-role client; one failing clip never aborts the project run.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import type {
  ClipCacheResult,
  ProjectClipCacheResult,
  CachedSelectedClip,
} from '@/lib/clip-cache/types'

type SelectedClipRow = Database['public']['Tables']['selected_clips']['Row']

export const CLIP_CACHE_BUCKET = 'video-clips-cache'
export const MAX_CLIP_BYTES = 100 * 1024 * 1024 // 100 MB
const DOWNLOAD_TIMEOUT_MS = 30_000

const ALLOWED_VIDEO_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

function metaRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Best available provider video URL for a selected clip. */
function downloadUrlFor(row: SelectedClipRow): string | null {
  if (row.source_url) return row.source_url
  const meta = metaRecord(row.metadata)
  if (typeof meta.sourceUrl === 'string') return meta.sourceUrl
  if (typeof meta.previewUrl === 'string') return meta.previewUrl
  return null
}

/** Is the content-type acceptable for a video download? */
function isAcceptableContentType(ct: string | null): boolean {
  if (!ct) return true // provider didn't say — allow and trust the URL
  const type = ct.split(';')[0].trim().toLowerCase()
  if (type === 'application/octet-stream') return true
  return ALLOWED_VIDEO_CONTENT_TYPES.includes(type)
}

/** All selected clips for a project (owner-scoped). */
export async function getSelectedClipsForCaching(
  projectId: string
): Promise<SelectedClipRow[]> {
  const { supabase, user } = await getAuthedContext()
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) throw new Error('Project not found.')

  const { data } = await supabase
    .from('selected_clips')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  return data ?? []
}

/** Cached-clip view for a project. */
export async function getCachedSelectedClips(
  projectId: string
): Promise<CachedSelectedClip[]> {
  const rows = await getSelectedClipsForCaching(projectId)
  return rows.map((r) => ({
    selectedClipId: r.id,
    sceneId: r.scene_id,
    sourceUrl: r.source_url,
    storageBucket: r.storage_bucket,
    storagePath: r.storage_path,
  }))
}

/** Download + cache one selected clip. Never throws for expected failures. */
export async function cacheSelectedClip(
  projectId: string,
  selectedClipId: string
): Promise<ClipCacheResult> {
  const { supabase, user } = await getAuthedContext()

  const { data: row } = await supabase
    .from('selected_clips')
    .select('*')
    .eq('id', selectedClipId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row) {
    return { selectedClipId, sceneId: '', status: 'failed', error: 'Selected clip not found.' }
  }

  const base: Pick<ClipCacheResult, 'selectedClipId' | 'sceneId'> = {
    selectedClipId: row.id,
    sceneId: row.scene_id,
  }

  const url = downloadUrlFor(row)
  if (!url) {
    return { ...base, status: 'no_source', error: 'No provider URL to download.' }
  }

  const path = `${user.id}/${projectId}/${row.scene_id}/${row.id}.mp4`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) {
      return { ...base, status: 'failed', error: `Download failed (${res.status}).` }
    }

    const contentType = res.headers.get('content-type')
    if (!isAcceptableContentType(contentType)) {
      return { ...base, status: 'failed', error: 'Unexpected content type.' }
    }

    // Skip early if the provider declares an oversized file.
    const declared = Number(res.headers.get('content-length') ?? '')
    if (Number.isFinite(declared) && declared > MAX_CLIP_BYTES) {
      return { ...base, status: 'too_large', error: 'Clip exceeds the 100 MB cap.' }
    }

    const blob = await res.blob()
    if (blob.size > MAX_CLIP_BYTES) {
      return { ...base, status: 'too_large', error: 'Clip exceeds the 100 MB cap.' }
    }

    const uploadType =
      contentType && contentType.startsWith('video/') ? contentType.split(';')[0].trim() : 'video/mp4'

    const { error: upErr } = await supabase.storage
      .from(CLIP_CACHE_BUCKET)
      .upload(path, blob, { upsert: true, contentType: uploadType, cacheControl: '3600' })
    if (upErr) {
      return { ...base, status: 'failed', error: 'Could not upload to storage.' }
    }

    // Record the cache location; keep source_url unchanged.
    const { error: updErr } = await supabase
      .from('selected_clips')
      .update({ storage_bucket: CLIP_CACHE_BUCKET, storage_path: path })
      .eq('id', row.id)
      .eq('user_id', user.id)
    if (updErr) {
      return { ...base, status: 'failed', error: 'Cached, but failed to record path.' }
    }

    return { ...base, status: 'cached', storageBucket: CLIP_CACHE_BUCKET, storagePath: path }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return { ...base, status: 'failed', error: aborted ? 'Download timed out.' : 'Download error.' }
  } finally {
    clearTimeout(timer)
  }
}

/** Cache every selected clip for a project (best-effort, idempotent). */
export async function cacheSelectedClipsForProject(
  projectId: string
): Promise<ProjectClipCacheResult> {
  const rows = await getSelectedClipsForCaching(projectId)
  const results: ClipCacheResult[] = []
  let cached = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    const result = await cacheSelectedClip(projectId, row.id)
    results.push(result)
    if (result.status === 'cached') cached += 1
    else if (result.status === 'skipped') skipped += 1
    else failed += 1
  }

  return { ok: failed === 0, cached, skipped, failed, results }
}
