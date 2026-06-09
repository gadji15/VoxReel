/**
 * VoxReel — render worker service (WORKER-ONLY, service role)
 *
 * Runs OUTSIDE the web request lifecycle (standalone process via tsx). It claims
 * queued `render_jobs` using a Postgres `FOR UPDATE SKIP LOCKED` RPC (migration
 * 002) so multiple workers never claim the same job, renders with FFmpeg,
 * uploads the MP4, records the `exports` row, heartbeats while working, and
 * retries with backoff on failure. A separate reaper requeues/fails stale jobs.
 *
 * Safety:
 *  - NEVER imported by the Next app / client. No `import 'server-only'` (so the
 *    tsx worker can load it); the admin client is created inline.
 *  - Service role bypasses RLS, so every query is still scoped to the job's own
 *    `project_id` + `user_id`. No secrets are logged.
 */

import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdminEnv } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/database.types'
import { buildRenderTimeline } from '@/lib/render/timeline'
import { renderTimelineToFile, type RenderSceneSpec } from '@/lib/render/ffmpeg-renderer'
import { isFfmpegAvailable, FFMPEG_UNAVAILABLE_MESSAGE } from '@/lib/render/environment'
import { EXPORTS_BUCKET, STATUS_RENDERED, DEFAULT_WORKER_POLL_MS } from '@/lib/render/constants'

type AdminClient = SupabaseClient<Database>
type RenderJobRow = Database['public']['Tables']['render_jobs']['Row']

/** How often to refresh `last_heartbeat_at` while a job is rendering. */
const HEARTBEAT_INTERVAL_MS = 30_000
/** Backoff bounds (seconds) for retry scheduling. */
const RETRY_BASE_SECONDS = 30
const RETRY_MAX_SECONDS = 600

let cachedAdmin: AdminClient | null = null
function getAdmin(): AdminClient {
  if (cachedAdmin) return cachedAdmin
  const { url, serviceRoleKey } = getSupabaseAdminEnv()
  cachedAdmin = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedAdmin
}

/* ── Job status helpers ──────────────────────────────────────────────────── */

/** Update progress/step and refresh the heartbeat (a render-step heartbeat). */
export async function markRenderJobProcessing(
  jobId: string,
  progress: number,
  currentStep: string
): Promise<void> {
  await getAdmin()
    .from('render_jobs')
    .update({
      status: 'processing',
      progress: Math.min(100, Math.max(0, Math.round(progress))),
      current_step: currentStep,
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

export async function markRenderJobCompleted(jobId: string): Promise<void> {
  await getAdmin()
    .from('render_jobs')
    .update({
      status: 'completed',
      progress: 100,
      current_step: 'Completed',
      completed_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq('id', jobId)
}

/** Hard failure — no retry (permanent/validation errors). */
export async function markRenderJobFailed(jobId: string, error: string): Promise<void> {
  await getAdmin()
    .from('render_jobs')
    .update({
      status: 'failed',
      current_step: 'Failed',
      failed_at: new Date().toISOString(),
      error_message: error.slice(0, 500),
      locked_at: null,
      locked_by: null,
    })
    .eq('id', jobId)
}

/** Refresh the heartbeat ONLY if this worker still owns the job. */
export async function heartbeatRenderJob(jobId: string, workerId: string): Promise<void> {
  await getAdmin()
    .from('render_jobs')
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('locked_by', workerId)
    .eq('status', 'processing')
}

/**
 * Decide retry vs. permanent failure for a transient render error. Requeues with
 * exponential backoff while attempts remain, else marks the job failed.
 */
export async function failOrRetryRenderJob(jobId: string, error: string): Promise<void> {
  const admin = getAdmin()
  const { data: job } = await admin
    .from('render_jobs')
    .select('attempts, max_attempts')
    .eq('id', jobId)
    .maybeSingle()

  const attempts = job?.attempts ?? 0
  const maxAttempts = job?.max_attempts ?? 3

  if (attempts < maxAttempts) {
    const backoff = Math.min(
      RETRY_BASE_SECONDS * 2 ** Math.max(0, attempts - 1),
      RETRY_MAX_SECONDS
    )
    const nextRetryAt = new Date(Date.now() + backoff * 1000).toISOString()
    await admin
      .from('render_jobs')
      .update({
        status: 'queued',
        progress: 0,
        current_step: 'Retry scheduled',
        error_message: error.slice(0, 500),
        next_retry_at: nextRetryAt,
        locked_at: null,
        locked_by: null,
      })
      .eq('id', jobId)
    // eslint-disable-next-line no-console
    console.log(`[render-worker] job ${jobId} retry ${attempts}/${maxAttempts} in ${backoff}s`)
  } else {
    await markRenderJobFailed(jobId, error)
    // eslint-disable-next-line no-console
    console.log(`[render-worker] job ${jobId} failed after ${attempts} attempts`)
  }
}

/* ── Claiming & reaping ──────────────────────────────────────────────────── */

/** Atomically claim the next queued job via the SKIP LOCKED RPC. */
export async function claimNextQueuedRenderJob(workerId: string): Promise<RenderJobRow | null> {
  const { data, error } = await getAdmin().rpc('claim_next_render_job', { worker_id: workerId })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[render-worker] claim error:', error.message)
    return null
  }
  const rows = (data ?? []) as RenderJobRow[]
  return rows[0] ?? null
}

/** Requeue (or fail) stale `processing` jobs. Returns the number affected. */
export async function requeueStaleRenderJobs(staleAfterSeconds: number): Promise<number> {
  const { data, error } = await getAdmin().rpc('requeue_stale_render_jobs', {
    stale_after_seconds: staleAfterSeconds,
  })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[render-worker] reaper error:', error.message)
    return 0
  }
  return typeof data === 'number' ? data : 0
}

/* ── Render execution ────────────────────────────────────────────────────── */

async function downloadToTemp(
  admin: AdminClient,
  bucket: string,
  storagePath: string,
  destPath: string
): Promise<string | null> {
  try {
    const { data, error } = await admin.storage.from(bucket).download(storagePath)
    if (error || !data) return null
    await writeFile(destPath, Buffer.from(await data.arrayBuffer()))
    return destPath
  } catch {
    return null
  }
}

/**
 * Render one job end-to-end with the service role. Permanent/validation errors
 * fail the job; transient render errors go through retry/backoff. Heartbeats
 * while working so the reaper doesn't requeue an actively-rendering job.
 */
export async function processRenderJobWithAdmin(jobId: string, workerId: string): Promise<void> {
  const admin = getAdmin()

  const { data: job } = await admin.from('render_jobs').select('*').eq('id', jobId).maybeSingle()
  if (!job) return
  const projectId = job.project_id
  const userId = job.user_id

  let workDir: string | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  try {
    // Keep the heartbeat fresh during long downloads/renders.
    heartbeat = setInterval(() => {
      void heartbeatRenderJob(jobId, workerId).catch(() => {})
    }, HEARTBEAT_INTERVAL_MS)

    // Scope every read to THIS job's project + user (defence-in-depth).
    const { data: project } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!project) {
      await markRenderJobFailed(jobId, 'Project not found.')
      return
    }

    const [scenesRes, clipsRes, captionsRes, audioRes] = await Promise.all([
      admin.from('scenes').select('*').eq('project_id', projectId).eq('user_id', userId).order('scene_index', { ascending: true }),
      admin.from('selected_clips').select('*').eq('project_id', projectId).eq('user_id', userId),
      admin.from('captions').select('*').eq('project_id', projectId).eq('user_id', userId),
      admin.from('audio_files').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    const scenes = scenesRes.data ?? []
    if (scenes.length === 0) {
      await markRenderJobFailed(jobId, 'No scenes to render. Run analysis first.')
      return
    }
    if (!(await isFfmpegAvailable())) {
      // Config/environment problem — permanent for this worker (no retry churn).
      await markRenderJobFailed(jobId, FFMPEG_UNAVAILABLE_MESSAGE)
      return
    }

    const timeline = buildRenderTimeline({
      scenes,
      selectedClips: clipsRes.data ?? [],
      captions: captionsRes.data ?? [],
      audio: audioRes.data ?? null,
    })

    await markRenderJobProcessing(jobId, 15, 'Preparing assets')
    workDir = await mkdtemp(path.join(tmpdir(), 'voxreel-render-'))

    const sceneSpecs: RenderSceneSpec[] = []
    for (const scene of timeline.scenes) {
      let localClipPath: string | null = null
      if (scene.hasClip && scene.clipBucket && scene.clipPath) {
        const dest = path.join(workDir, `clip_${scene.index}.mp4`)
        localClipPath = await downloadToTemp(admin, scene.clipBucket, scene.clipPath, dest)
      }
      sceneSpecs.push({
        index: scene.index,
        durationSeconds: scene.durationSeconds,
        text: scene.text,
        emotionColor: scene.emotionColor,
        localClipPath,
      })
    }

    await markRenderJobProcessing(jobId, 40, 'Downloading audio')
    let audioLocalPath: string | null = null
    if (timeline.audio) {
      const dest = path.join(workDir, 'audio.input')
      audioLocalPath = await downloadToTemp(admin, timeline.audio.bucket, timeline.audio.path, dest)
    }

    await markRenderJobProcessing(jobId, 55, 'Rendering 1080×1920')
    const outputPath = path.join(workDir, 'final.mp4')
    await renderTimelineToFile({
      workDir,
      outputPath,
      width: timeline.width,
      height: timeline.height,
      fps: timeline.fps,
      scenes: sceneSpecs,
      audioLocalPath,
    })

    await markRenderJobProcessing(jobId, 85, 'Uploading export')
    const fileBuffer = await readFile(outputPath)
    const storagePath = `${userId}/${projectId}/final.mp4`
    const { error: upErr } = await admin.storage
      .from(EXPORTS_BUCKET)
      .upload(storagePath, fileBuffer, { upsert: true, contentType: 'video/mp4', cacheControl: '3600' })
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

    const { error: exErr } = await admin.from('exports').insert({
      project_id: projectId,
      user_id: userId,
      render_job_id: jobId,
      file_name: 'final.mp4',
      storage_bucket: EXPORTS_BUCKET,
      storage_path: storagePath,
      format: 'mp4',
      mime_type: 'video/mp4',
      duration_seconds: Math.round(timeline.totalDurationSeconds),
      size_bytes: fileBuffer.byteLength,
      resolution_width: timeline.width,
      resolution_height: timeline.height,
      fps: timeline.fps,
    })
    if (exErr) throw new Error(`Export record failed: ${exErr.message}`)

    await admin.from('projects').update({ status: STATUS_RENDERED }).eq('id', projectId).eq('user_id', userId)
    await markRenderJobCompleted(jobId)
  } catch (err) {
    // Transient render/upload error → retry with backoff (or fail if exhausted).
    const message = err instanceof Error ? err.message : 'Render failed.'
    await failOrRetryRenderJob(jobId, message)
  } finally {
    if (heartbeat) clearInterval(heartbeat)
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

/** Claim + process the next queued job. Returns true if a job was processed. */
export async function processNextQueuedRenderJob(workerId: string): Promise<boolean> {
  const job = await claimNextQueuedRenderJob(workerId)
  if (!job) return false
  // eslint-disable-next-line no-console
  console.log(`[render-worker] claimed job ${job.id} (project ${job.project_id}, attempt ${job.attempts})`)
  await processRenderJobWithAdmin(job.id, workerId)
  // eslint-disable-next-line no-console
  console.log(`[render-worker] finished job ${job.id}`)
  return true
}

/* ── Polling loop ────────────────────────────────────────────────────────── */

let stopRequested = false
export function requestRenderWorkerStop(): void {
  stopRequested = true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Poll for queued jobs and process them one at a time (MVP concurrency = 1). */
export async function processQueuedRenderJobsLoop(workerId: string): Promise<void> {
  const pollMs = Number(process.env.RENDER_WORKER_POLL_INTERVAL_MS) || DEFAULT_WORKER_POLL_MS
  // eslint-disable-next-line no-console
  console.log(`[render-worker] worker ${workerId} polling every ${pollMs}ms`)
  stopRequested = false
  while (!stopRequested) {
    try {
      const processed = await processNextQueuedRenderJob(workerId)
      if (!processed && !stopRequested) await sleep(pollMs)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[render-worker] loop error:', err instanceof Error ? err.message : 'unknown')
      if (!stopRequested) await sleep(pollMs)
    }
  }
  // eslint-disable-next-line no-console
  console.log('[render-worker] loop stopped')
}
