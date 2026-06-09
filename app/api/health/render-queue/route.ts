import { NextResponse } from 'next/server'
import { getRenderWorkerHealthSummary } from '@/lib/services/render-monitoring.service'

/**
 * GET /api/health/render-queue
 *
 * Aggregate render-queue health for developers. Returns only counts/timestamps
 * (no user content, no secrets):
 *
 *   { ok, queue: {...}, worker: { healthy, message }, ffmpeg, timestamp }
 *
 * 200 when healthy; 503 when the queue looks unhealthy (stale processing jobs or
 * a queued backlog with no worker consuming). No auth required (dev diagnostics).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const health = await getRenderWorkerHealthSummary()
    return NextResponse.json(
      {
        ok: health.healthy,
        queue: {
          queued: health.stats.queued,
          processing: health.stats.processing,
          completedRecent: health.stats.completedRecent,
          failedRecent: health.stats.failedRecent,
          staleProcessing: health.stats.staleProcessing,
          oldestQueuedAgeSeconds: health.stats.oldestQueuedAgeSeconds,
          latestCompletedAt: health.stats.latestCompletedAt,
          latestFailedAt: health.stats.latestFailedAt,
        },
        worker: { healthy: health.healthy, message: health.message },
        ffmpeg: { available: health.ffmpegAvailable, environment: health.environment },
        staleAfterSeconds: health.staleAfterSeconds,
        timestamp,
      },
      { status: health.healthy ? 200 : 503 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render queue diagnostics failed.'
    return NextResponse.json({ ok: false, message, timestamp }, { status: 503 })
  }
}
