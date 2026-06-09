/**
 * VoxReel — render worker service (WORKER-ONLY, service role)
 *
 * Runs OUTSIDE the web request lifecycle (standalone process via tsx). It claims
 * queued `render_jobs`, runs the FFmpeg pipeline, uploads the MP4, records the
 * `exports` row, and updates statuses — using the Supabase SERVICE ROLE.
 *
 * Safety:
 *  - This file is NEVER imported by the Next app / client. It has NO
 *    `import 'server-only'` so the worker (plain Node/tsx) can load it, and it
 *    creates the admin client inline (not via the `server-only` admin module).
 *  - The service role bypasses RLS, so EVERY query is still scoped to the job's
 *    own `project_id` + `user_id`.
 *  - No secrets are logged.
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
    })
    .eq('id', jobId)
}

export async function markRenderJobFailed(jobId: string, error: string): Promise<void> {
  await getAdmin()
    .from('render_jobs')
    .update({
      status: 'failed',
      current_step: 'Failed',
      failed_at: new Date().toISOString(),
      error_message: error.slice(0, 500),
    })
    .eq('id', jobId)
}

/**
 * Atomically claim the oldest queued job: flip it to `processing` only if it is
 * still `queued` (guards against two workers grabbing the same job).
 */
export async function claimNextQueuedRenderJob(): Promise<RenderJobRow | null> {
  const admin = getAdmin()
  const { data: next } = await admin
    .from('render_jobs')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!next) return null

  const { data: claimed } = await admin
    .from('render_jobs')
    .update({
      status: 'processing',
      progress: 5,
      current_step: 'Starting render',
      started_at: new Date().toISOString(),
    })
    .eq('id', next.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle()

  return claimed ?? null
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

/** Render one job end-to-end with the service role. Safe to call after claiming. */
export async function processRenderJobWithAdmin(jobId: string): Promise<void> {
  const admin = getAdmin()

  const { data: job } = await admin.from('render_jobs').select('*').eq('id', jobId).maybeSingle()
  if (!job) return
  const projectId = job.project_id
  const userId = job.user_id

  let workDir: string | null = null
  try {
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
    const message = err instanceof Error ? err.message : 'Render failed.'
    await markRenderJobFailed(jobId, message)
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

/** Claim + process the next queued job. Returns true if a job was processed. */
export async function processNextQueuedRenderJob(): Promise<boolean> {
  const job = await claimNextQueuedRenderJob()
  if (!job) return false
  // eslint-disable-next-line no-console
  console.log(`[render-worker] processing job ${job.id} (project ${job.project_id})`)
  await processRenderJobWithAdmin(job.id)
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
export async function processQueuedRenderJobsLoop(): Promise<void> {
  const pollMs = Number(process.env.RENDER_WORKER_POLL_INTERVAL_MS) || DEFAULT_WORKER_POLL_MS
  // eslint-disable-next-line no-console
  console.log(`[render-worker] started — polling every ${pollMs}ms`)
  stopRequested = false
  while (!stopRequested) {
    try {
      const processed = await processNextQueuedRenderJob()
      if (!processed && !stopRequested) await sleep(pollMs)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[render-worker] loop error:', err instanceof Error ? err.message : 'unknown')
      if (!stopRequested) await sleep(pollMs)
    }
  }
  // eslint-disable-next-line no-console
  console.log('[render-worker] stopped')
}
