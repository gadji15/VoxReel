import 'server-only'

/**
 * VoxReel — render service (SERVER-ONLY)
 *
 * MVP renderer: builds a 1080×1920 timeline from the project's scenes + cached
 * clips + audio, renders an MP4 with FFmpeg, uploads it to `video-exports`, and
 * records `render_jobs` + `exports`. Synchronous for the MVP. Never uses the
 * admin/service-role client; never exposes secrets.
 */

import { redirect } from 'next/navigation'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import { buildRenderTimeline, RENDER_WIDTH, RENDER_HEIGHT, RENDER_FPS } from '@/lib/render/timeline'
import { renderTimelineToFile, type RenderSceneSpec } from '@/lib/render/ffmpeg-renderer'
import type { RenderResult, RenderExportMetadata, RenderJobStatus } from '@/lib/render/types'

type RenderJobRow = Database['public']['Tables']['render_jobs']['Row']
type ExportRow = Database['public']['Tables']['exports']['Row']

export const EXPORTS_BUCKET = 'video-exports'
export const STATUS_RENDERED = 'rendered'
const SIGNED_URL_TTL = 60 * 60 // 1 hour

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

/** Create a queued render job for the project. */
export async function createRenderJob(projectId: string): Promise<RenderJobRow> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('render_jobs')
    .insert({
      project_id: projectId,
      user_id: user.id,
      status: 'queued',
      progress: 0,
      resolution_width: RENDER_WIDTH,
      resolution_height: RENDER_HEIGHT,
      fps: RENDER_FPS,
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`[render.service] createRenderJob failed: ${error?.message ?? 'no row'}`)
  }
  return data
}

/** The latest render job for the project, or null. */
export async function getRenderJob(projectId: string): Promise<RenderJobRow | null> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export async function updateRenderJobProgress(
  jobId: string,
  progress: number,
  currentStep: string,
  status?: RenderJobStatus
): Promise<void> {
  const { supabase, user } = await getAuthedContext()
  const patch: Database['public']['Tables']['render_jobs']['Update'] = {
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    current_step: currentStep,
  }
  if (status) patch.status = status
  await supabase.from('render_jobs').update(patch).eq('id', jobId).eq('user_id', user.id)
}

/** Insert an export row for a finished render. */
export async function createExportRecord(
  projectId: string,
  renderJobId: string | null,
  output: { storagePath: string; sizeBytes: number; durationSeconds: number }
): Promise<ExportRow> {
  const { supabase, user } = await getAuthedContext()
  const { data, error } = await supabase
    .from('exports')
    .insert({
      project_id: projectId,
      user_id: user.id,
      render_job_id: renderJobId,
      file_name: 'final.mp4',
      storage_bucket: EXPORTS_BUCKET,
      storage_path: output.storagePath,
      format: 'mp4',
      mime_type: 'video/mp4',
      duration_seconds: output.durationSeconds,
      size_bytes: output.sizeBytes,
      resolution_width: RENDER_WIDTH,
      resolution_height: RENDER_HEIGHT,
      fps: RENDER_FPS,
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`[render.service] createExportRecord failed: ${error?.message ?? 'no row'}`)
  }
  return data
}

async function signedUrlFor(
  supabase: ServerClient,
  storagePath: string
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(EXPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL)
  return data?.signedUrl ?? null
}

function toExportMetadata(row: ExportRow, downloadUrl: string | null): RenderExportMetadata {
  return {
    exportId: row.id,
    fileName: row.file_name ?? 'final.mp4',
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path ?? '',
    format: row.format,
    mimeType: row.mime_type,
    durationSeconds: Number(row.duration_seconds ?? 0),
    sizeBytes: Number(row.size_bytes ?? 0),
    width: row.resolution_width,
    height: row.resolution_height,
    fps: row.fps,
    createdAt: row.created_at,
    downloadUrl,
  }
}

/** The latest export for a project (+ a short-lived signed download URL). */
export async function getLatestExport(projectId: string): Promise<RenderExportMetadata | null> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('exports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const url = data.storage_path ? await signedUrlFor(supabase, data.storage_path) : null
  return toExportMetadata(data, url)
}

/** Download a storage object to a local temp file; returns the path or null. */
async function downloadToTemp(
  supabase: ServerClient,
  bucket: string,
  storagePath: string,
  destPath: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(storagePath)
    if (error || !data) return null
    const buffer = Buffer.from(await data.arrayBuffer())
    await writeFile(destPath, buffer)
    return destPath
  } catch {
    return null
  }
}

/**
 * Render the project end-to-end (synchronous MVP). Verifies ownership + scenes,
 * downloads cached clips + audio, runs FFmpeg, uploads the MP4, and records the
 * export. On failure, marks the job failed and returns a clean error — scenes
 * and selected clips are never deleted.
 */
export async function renderProject(projectId: string): Promise<RenderResult> {
  const { supabase, user } = await getAuthedContext()

  // Ownership.
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) return { ok: false, status: 'failed', error: 'Project not found.' }

  // Load timeline inputs.
  const [scenesRes, clipsRes, captionsRes, audioRes] = await Promise.all([
    supabase.from('scenes').select('*').eq('project_id', projectId).eq('user_id', user.id).order('scene_index', { ascending: true }),
    supabase.from('selected_clips').select('*').eq('project_id', projectId).eq('user_id', user.id),
    supabase.from('captions').select('*').eq('project_id', projectId).eq('user_id', user.id),
    supabase.from('audio_files').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const scenes = scenesRes.data ?? []
  if (scenes.length === 0) {
    return { ok: false, status: 'failed', error: 'No scenes to render. Run analysis first.' }
  }

  const timeline = buildRenderTimeline({
    scenes,
    selectedClips: clipsRes.data ?? [],
    captions: captionsRes.data ?? [],
    audio: audioRes.data ?? null,
  })

  const job = await createRenderJob(projectId)
  await updateRenderJobProgress(job.id, 10, 'Preparing assets', 'processing')

  let workDir: string | null = null
  try {
    workDir = await mkdtemp(path.join(tmpdir(), 'voxreel-render-'))

    // Download cached clips (best-effort: missing clip → color background).
    const sceneSpecs: RenderSceneSpec[] = []
    for (const scene of timeline.scenes) {
      let localClipPath: string | null = null
      if (scene.hasClip && scene.clipBucket && scene.clipPath) {
        const dest = path.join(workDir, `clip_${scene.index}.mp4`)
        localClipPath = await downloadToTemp(supabase, scene.clipBucket, scene.clipPath, dest)
      }
      sceneSpecs.push({
        index: scene.index,
        durationSeconds: scene.durationSeconds,
        text: scene.text,
        emotionColor: scene.emotionColor,
        localClipPath,
      })
    }

    await updateRenderJobProgress(job.id, 40, 'Downloading audio', 'processing')
    let audioLocalPath: string | null = null
    if (timeline.audio) {
      const dest = path.join(workDir, 'audio.input')
      audioLocalPath = await downloadToTemp(supabase, timeline.audio.bucket, timeline.audio.path, dest)
    }

    await updateRenderJobProgress(job.id, 55, 'Rendering 1080×1920', 'processing')
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

    await updateRenderJobProgress(job.id, 85, 'Uploading export', 'processing')
    const fileBuffer = await readFile(outputPath)
    const storagePath = `${user.id}/${projectId}/final.mp4`
    const { error: upErr } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .upload(storagePath, fileBuffer, { upsert: true, contentType: 'video/mp4', cacheControl: '3600' })
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

    const exportRow = await createExportRecord(projectId, job.id, {
      storagePath,
      sizeBytes: fileBuffer.byteLength,
      durationSeconds: Math.round(timeline.totalDurationSeconds),
    })

    await supabase
      .from('render_jobs')
      .update({ status: 'completed', progress: 100, current_step: 'Completed', completed_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('user_id', user.id)
    await supabase.from('projects').update({ status: STATUS_RENDERED }).eq('id', projectId).eq('user_id', user.id)

    const downloadUrl = await signedUrlFor(supabase, storagePath)
    return { ok: true, jobId: job.id, status: 'completed', export: toExportMetadata(exportRow, downloadUrl) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render failed.'
    await supabase
      .from('render_jobs')
      .update({ status: 'failed', failed_at: new Date().toISOString(), error_message: message })
      .eq('id', job.id)
      .eq('user_id', user.id)
    return { ok: false, jobId: job.id, status: 'failed', error: message }
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
