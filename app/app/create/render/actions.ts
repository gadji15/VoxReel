'use server'

/**
 * VoxReel — render server actions
 *
 * Web side: ENQUEUE a render job (no FFmpeg here) and read job status / export
 * metadata. The worker (`pnpm worker:render`) processes queued jobs. Returns
 * clean serializable data; never exposes secrets.
 */

import {
  enqueueRenderProject,
  getLatestRenderJobForProject,
} from '@/lib/services/render-queue.service'
import { getLatestExport } from '@/lib/services/render.service'
import type { RenderExportMetadata, RenderJobStatus } from '@/lib/render/types'

export interface EnqueueRenderResult {
  ok: boolean
  jobId: string | null
  status: RenderJobStatus | 'none'
  error: string | null
}

export interface RenderStatusView {
  status: RenderJobStatus | 'none'
  progress: number
  currentStep: string | null
  error: string | null
}

/** Enqueue a render job for the project (deduped). Does NOT run FFmpeg. */
export async function startRenderProjectAction(projectId: string): Promise<EnqueueRenderResult> {
  try {
    const job = await enqueueRenderProject(projectId)
    return { ok: true, jobId: job.id, status: job.status as RenderJobStatus, error: null }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Could not start render.'
    return { ok: false, jobId: null, status: 'none', error }
  }
}

/** Read the latest render job status for the project (polled by the UI). */
export async function getRenderStatusAction(projectId: string): Promise<RenderStatusView> {
  try {
    const job = await getLatestRenderJobForProject(projectId)
    if (!job) return { status: 'none', progress: 0, currentStep: null, error: null }
    return {
      status: job.status as RenderJobStatus,
      progress: job.progress,
      currentStep: job.current_step,
      error: job.error_message,
    }
  } catch {
    return { status: 'none', progress: 0, currentStep: null, error: null }
  }
}

/** Read the latest export metadata (+ signed download URL) for the project. */
export async function getLatestExportAction(
  projectId: string
): Promise<RenderExportMetadata | null> {
  try {
    return await getLatestExport(projectId)
  } catch {
    return null
  }
}
