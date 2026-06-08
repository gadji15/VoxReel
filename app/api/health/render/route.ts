import { NextResponse } from 'next/server'
import { getFfmpegDiagnostics } from '@/lib/render/environment'

/**
 * GET /api/health/render
 *
 * Reports whether FFmpeg-based rendering is available in this environment.
 * Returns `{ ok, ffmpegAvailable, ffmpegPath?, environment, message, timestamp }`.
 *
 * Safety: no secrets are read or returned (the FFmpeg path is a filesystem path,
 * not a credential). No auth required. `ok` is false when FFmpeg is unavailable.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const diagnostics = await getFfmpegDiagnostics()
    return NextResponse.json(
      { ...diagnostics, timestamp },
      { status: diagnostics.ok ? 200 : 503 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render diagnostics failed.'
    return NextResponse.json(
      { ok: false, ffmpegAvailable: false, environment: 'unknown', message, timestamp },
      { status: 503 }
    )
  }
}
