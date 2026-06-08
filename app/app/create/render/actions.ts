'use server'

/**
 * VoxReel — render server actions
 *
 * Server-only entry points for the MVP renderer. Return clean serializable data;
 * never expose secrets or storage internals beyond a short-lived signed URL.
 */

import {
  renderProject,
  getRenderJob,
  getLatestExport,
} from '@/lib/services/render.service'
import type { RenderResult, RenderExportMetadata, RenderJobStatus } from '@/lib/render/types'

export interface RenderStatusView {
  status: RenderJobStatus | 'none'
  progress: number
  currentStep: string | null
  error: string | null
}

/** Render the project now (synchronous MVP) and return the result. */
export async function startRenderProjectAction(projectId: string): Promise<RenderResult> {
  try {
    return await renderProject(projectId)
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Render failed.'
    return { ok: false, status: 'failed', error }
  }
}

/** Read the latest render job status for the project. */
export async function getRenderStatusAction(projectId: string): Promise<RenderStatusView> {
  try {
    const job = await getRenderJob(projectId)
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
