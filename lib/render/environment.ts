import 'server-only'

/**
 * VoxReel — render environment diagnostics (SERVER-ONLY)
 *
 * Detects whether FFmpeg is usable in the current runtime so we can fail render
 * requests gracefully (instead of with a confusing FFmpeg spawn error), and so a
 * health route can report readiness. No secrets are read or returned; the
 * resolved FFmpeg *path* is a filesystem path, not a credential.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

export type RenderEnvironment = 'local' | 'vercel' | 'node-server' | 'unknown'

export interface RenderDiagnostics {
  ok: boolean
  ffmpegAvailable: boolean
  ffmpegPath?: string
  environment: RenderEnvironment
  message: string
}

const VERIFY_TIMEOUT_MS = 5000

/** Classify the runtime without reading any secret. */
export function detectRenderEnvironment(): RenderEnvironment {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return 'vercel'
  if (process.env.NODE_ENV === 'development') return 'local'
  if (process.env.NODE_ENV === 'production') return 'node-server'
  return 'unknown'
}

/** Resolve the optional `ffmpeg-static` path if the package is installed. */
function tryStaticFfmpegPath(): string | null {
  try {
    const req = createRequire(import.meta.url)
    // Indirect specifier so bundlers don't try to resolve this OPTIONAL package.
    const moduleName = ['ffmpeg', 'static'].join('-')
    const p = req(moduleName) as unknown
    return typeof p === 'string' && p && existsSync(p) ? p : null
  } catch {
    return null
  }
}

/** Spawn `<bin> -version` and resolve true only on a clean exit. Never throws. */
function verifyBinaryRuns(bin: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const done = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    try {
      const proc = spawn(bin, ['-version'], { windowsHide: true })
      const timer = setTimeout(() => {
        proc.kill('SIGKILL')
        done(false)
      }, VERIFY_TIMEOUT_MS)
      proc.on('error', () => {
        clearTimeout(timer)
        done(false)
      })
      proc.on('close', (code) => {
        clearTimeout(timer)
        done(code === 0)
      })
    } catch {
      done(false)
    }
  })
}

/** Resolve a usable FFmpeg binary (env → ffmpeg-static → PATH), verifying it. */
async function resolveAvailableFfmpeg(): Promise<{ available: boolean; path?: string }> {
  const envPath = process.env.FFMPEG_PATH?.trim()
  if (envPath && existsSync(envPath)) return { available: true, path: envPath }

  const staticPath = tryStaticFfmpegPath()
  if (staticPath) return { available: true, path: staticPath }

  // Last resort: a system `ffmpeg` on PATH — verify it actually runs.
  if (await verifyBinaryRuns('ffmpeg')) return { available: true, path: 'ffmpeg' }

  return { available: false }
}

/** True if FFmpeg can be invoked in this environment. */
export async function isFfmpegAvailable(): Promise<boolean> {
  const { available } = await resolveAvailableFfmpeg()
  return available
}

/** Full, serializable render diagnostics (safe to return from a health route). */
export async function getFfmpegDiagnostics(): Promise<RenderDiagnostics> {
  const environment = detectRenderEnvironment()
  const { available, path } = await resolveAvailableFfmpeg()

  let message: string
  if (available) {
    message = 'FFmpeg is available — rendering should work in this environment.'
  } else if (environment === 'vercel') {
    message =
      'Rendering is not available on serverless (Vercel): FFmpeg is missing. Run locally with FFmpeg or use the render worker.'
  } else {
    message =
      'FFmpeg was not found. Install FFmpeg, set FFMPEG_PATH, or add the ffmpeg-static package, then retry.'
  }

  return {
    ok: available,
    ffmpegAvailable: available,
    ffmpegPath: path,
    environment,
    message,
  }
}
