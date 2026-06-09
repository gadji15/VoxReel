/**
 * VoxReel — render worker (standalone process)
 *
 * Run with: `pnpm worker:render` (tsx). Polls Supabase for `queued` render jobs
 * and processes them with FFmpeg, one at a time. Requires FFmpeg available at
 * runtime and `SUPABASE_SERVICE_ROLE_KEY` (server-side only — NEVER exposed to
 * the browser). This file is NOT part of the Next app bundle.
 *
 * Env: loaded from `.env.local` (best-effort, no extra deps). Override the bucket
 * keys / FFmpeg path / poll interval via env (see `.env.example`).
 */

import { readFileSync, existsSync } from 'node:fs'
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

async function main() {
  // Import AFTER env is loaded so the admin client can read its keys.
  const { processQueuedRenderJobsLoop, requestRenderWorkerStop } = await import(
    '@/lib/services/render-worker.service'
  )

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Name the missing variable only — never print values.
    console.error(
      '[render-worker] Missing SUPABASE_SERVICE_ROLE_KEY and/or NEXT_PUBLIC_SUPABASE_URL. ' +
        'Add them to .env.local. The worker needs the service role (server-side only).'
    )
    process.exit(1)
  }

  const shutdown = (signal: string) => {
    console.log(`[render-worker] received ${signal}, shutting down…`)
    requestRenderWorkerStop()
    // Give the current job a moment, then force-exit.
    setTimeout(() => process.exit(0), 2000)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  await processQueuedRenderJobsLoop()
}

main().catch((err) => {
  console.error('[render-worker] fatal:', err instanceof Error ? err.message : 'unknown error')
  process.exit(1)
})
