import 'server-only'

/**
 * VoxReel — render queue monitoring (SERVER-ONLY)
 *
 * Aggregate, developer-facing diagnostics for the render queue + worker. Returns
 * only COUNTS and timestamps (no user content, no secrets). Uses the Supabase
 * admin client so it can see the whole queue (RLS would otherwise scope to one
 * user); the data exposed is intentionally non-sensitive aggregate health.
 *
 * Never imported by client components / the worker; never returns the service
 * role key or any private row content.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getFfmpegDiagnostics } from '@/lib/render/environment'

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24h for "recent" completed/failed
const BACKLOG_WARN_SECONDS = 600 // queued jobs older than this suggest no worker

/** Stale threshold (seconds) — mirrors the worker/reaper env (default 900). */
export function staleAfterSeconds(): number {
  return Number(process.env.RENDER_WORKER_STALE_AFTER_SECONDS) || 900
}

export interface RenderQueueStats {
  queued: number
  processing: number
  completedRecent: number
  failedRecent: number
  staleProcessing: number
  oldestQueuedAgeSeconds: number | null
  latestCompletedAt: string | null
  latestFailedAt: string | null
}

/** A sanitized render-job summary (no user_id, no secrets). */
export interface RenderJobSummary {
  id: string
  projectId: string
  status: string
  progress: number
  attempts: number
  maxAttempts: number
  lockedBy: string | null
  currentStep: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  lastHeartbeatAt: string | null
}

export interface RenderWorkerHealth {
  healthy: boolean
  message: string
  ffmpegAvailable: boolean
  environment: string
  staleAfterSeconds: number
  stats: RenderQueueStats
}

/** Aggregate queue counts + key timestamps. */
export async function getRenderQueueStats(): Promise<RenderQueueStats> {
  const admin = createSupabaseAdminClient()
  const stale = staleAfterSeconds()
  const now = Date.now()
  const recentCutoff = new Date(now - RECENT_WINDOW_MS).toISOString()

  const [queuedRes, processingRes, completedRes, failedRes, oldestQueuedRes, latestCompletedRes, latestFailedRes, processingRows] =
    await Promise.all([
      admin.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
      admin.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
      admin.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', recentCutoff),
      admin.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('failed_at', recentCutoff),
      admin.from('render_jobs').select('created_at').eq('status', 'queued').order('created_at', { ascending: true }).limit(1).maybeSingle(),
      admin.from('render_jobs').select('completed_at').eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('render_jobs').select('failed_at').eq('status', 'failed').order('failed_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('render_jobs').select('last_heartbeat_at, locked_at, started_at, created_at').eq('status', 'processing'),
    ])

  // Compute stale processing in JS (processing rows are few — one per worker).
  const staleMs = stale * 1000
  const staleProcessing = (processingRows.data ?? []).filter((r) => {
    const ts = r.last_heartbeat_at ?? r.locked_at ?? r.started_at ?? r.created_at
    return ts ? now - new Date(ts).getTime() > staleMs : true
  }).length

  const oldestQueuedAgeSeconds = oldestQueuedRes.data?.created_at
    ? Math.max(0, Math.floor((now - new Date(oldestQueuedRes.data.created_at).getTime()) / 1000))
    : null

  return {
    queued: queuedRes.count ?? 0,
    processing: processingRes.count ?? 0,
    completedRecent: completedRes.count ?? 0,
    failedRecent: failedRes.count ?? 0,
    staleProcessing,
    oldestQueuedAgeSeconds,
    latestCompletedAt: latestCompletedRes.data?.completed_at ?? null,
    latestFailedAt: latestFailedRes.data?.failed_at ?? null,
  }
}

function toSummary(row: {
  id: string
  project_id: string
  status: string
  progress: number
  attempts: number
  max_attempts: number
  locked_by: string | null
  current_step: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  last_heartbeat_at: string | null
}): RenderJobSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    progress: row.progress,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lockedBy: row.locked_by,
    currentStep: row.current_step,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastHeartbeatAt: row.last_heartbeat_at,
  }
}

/** Most recent render jobs across the queue (sanitized summaries). */
export async function getRecentRenderJobs(limit = 10): Promise<RenderJobSummary[]> {
  const admin = createSupabaseAdminClient()
  const { data } = await admin
    .from('render_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50))
  return (data ?? []).map(toSummary)
}

/** Processing jobs whose heartbeat/lock is older than the stale threshold. */
export async function getStaleRenderJobs(): Promise<RenderJobSummary[]> {
  const admin = createSupabaseAdminClient()
  const staleMs = staleAfterSeconds() * 1000
  const now = Date.now()
  const { data } = await admin
    .from('render_jobs')
    .select('*')
    .eq('status', 'processing')
    .order('created_at', { ascending: true })
  return (data ?? [])
    .filter((r) => {
      const ts = r.last_heartbeat_at ?? r.updated_at ?? r.created_at
      return ts ? now - new Date(ts).getTime() > staleMs : true
    })
    .map(toSummary)
}

/** Combined health summary used by the health route + diagnostics page. */
export async function getRenderWorkerHealthSummary(): Promise<RenderWorkerHealth> {
  const [ffmpeg, stats] = await Promise.all([getFfmpegDiagnostics(), getRenderQueueStats()])

  let healthy = true
  let message = 'Render queue healthy.'

  // NOTE: FFmpeg availability here reflects THIS host (which may not be the
  // worker host), so it informs but does not flip queue health.
  if (stats.staleProcessing > 0) {
    healthy = false
    message = `${stats.staleProcessing} stale processing job(s) — a worker may have died (reaper will requeue/fail them).`
  } else if (stats.queued > 0 && (stats.oldestQueuedAgeSeconds ?? 0) > BACKLOG_WARN_SECONDS) {
    healthy = false
    message = `${stats.queued} job(s) queued; oldest waiting ${stats.oldestQueuedAgeSeconds}s — is the render worker running?`
  }

  return {
    healthy,
    message,
    ffmpegAvailable: ffmpeg.ffmpegAvailable,
    environment: ffmpeg.environment,
    staleAfterSeconds: staleAfterSeconds(),
    stats,
  }
}
