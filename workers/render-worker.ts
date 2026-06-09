/**
 * VoxReel — render worker (standalone process)
 *
 * Run with: `pnpm worker:render` (tsx). Claims `queued` render jobs via the
 * Postgres SKIP-LOCKED RPC, processes them with FFmpeg one at a time, and runs a
 * periodic reaper that requeues/fails stale `processing` jobs. Requires FFmpeg
 * at runtime and `SUPABASE_SERVICE_ROLE_KEY` (server-side only — NEVER exposed
 * to the browser). NOT part of the Next app bundle.
 *
 * Env (see `.env.example`): RENDER_WORKER_ID, RENDER_WORKER_POLL_INTERVAL_MS,
 * RENDER_WORKER_STALE_AFTER_SECONDS, RENDER_WORKER_REAPER_INTERVAL_MS.
 * `.env.local` is loaded best-effort (no extra deps); values are never logged.
 */

import { readFileSync, existsSync } from 'node:fs'
import { hostname } from 'node:os'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

/** Minimal `.env.local` loader (no dotenv dependency). Never logs values. */
function loadEnvFile(file: string): void {
  try {
    if (!existsSync(file)) return
    const content = readFileSync(file, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (key && process.env[key] === undefined) process.env[key] = value
    }
  } catch {
    /* best-effort */
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

/** A stable-ish worker id (from env, else host+pid+random). Not a secret. */
function resolveWorkerId(): string {
  const fromEnv = process.env.RENDER_WORKER_ID?.trim()
  if (fromEnv) return fromEnv
  return `worker-${hostname()}-${process.pid}-${randomBytes(3).toString('hex')}`
}

async function main() {
  // Import AFTER env is loaded so the admin client can read its keys.
  const { processQueuedRenderJobsLoop, requestRenderWorkerStop, requeueStaleRenderJobs } =
    await import('@/lib/services/render-worker.service')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Name the missing variable only — never print values.
    console.error(
      '[render-worker] Missing SUPABASE_SERVICE_ROLE_KEY and/or NEXT_PUBLIC_SUPABASE_URL. ' +
        'Add them to .env.local. The worker needs the service role (server-side only).'
    )
    process.exit(1)
  }

  const workerId = resolveWorkerId()
  const staleAfterSeconds = Number(process.env.RENDER_WORKER_STALE_AFTER_SECONDS) || 900
  const reaperIntervalMs = Number(process.env.RENDER_WORKER_REAPER_INTERVAL_MS) || 60_000

  console.log(`[render-worker] starting as "${workerId}" (stale after ${staleAfterSeconds}s)`)

  // Periodic stale-job reaper (requeues/fails jobs left by dead workers).
  const reaper = setInterval(() => {
    void requeueStaleRenderJobs(staleAfterSeconds)
      .then((n) => {
        if (n > 0) console.log(`[render-worker] reaper requeued/failed ${n} stale job(s)`)
      })
      .catch(() => {})
  }, reaperIntervalMs)

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[render-worker] received ${signal}, shutting down…`)
    clearInterval(reaper)
    requestRenderWorkerStop()
    // Give the current job a moment, then force-exit.
    setTimeout(() => process.exit(0), 2000)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  await processQueuedRenderJobsLoop(workerId)
}

main().catch((err) => {
  console.error('[render-worker] fatal:', err instanceof Error ? err.message : 'unknown error')
  process.exit(1)
})
