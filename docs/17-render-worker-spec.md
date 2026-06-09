# 17 — Render Worker Spec

> Status: **Implemented (MVP).** Rendering is now **queue + worker** based: the
> web app enqueues a `render_jobs` row; a standalone worker process claims and
> renders it with FFmpeg. This replaces the previous blocking server-action
> render. Single-process, polling-based — not a distributed queue.

## Architecture

```
Browser ──(server action)──► render_jobs (status: queued)
                                   │
        Render worker (Node/tsx) ──┤ polls every N ms, claims oldest queued job
                                   ▼
        status: processing → FFmpeg render → upload video-exports → exports row
                                   ▼
                             status: completed (or failed)
Browser ◄──(poll getRenderStatusAction)── render_jobs.progress/status
```

- **Web (session client, RLS):**
  - `lib/services/render-queue.service.ts` — `enqueueRenderProject` (dedupes an
    in-flight `queued`/`processing` job), `getLatestRenderJobForProject`,
    `getRenderJobById`.
  - `lib/services/render.service.ts` — `getLatestExport` (+ signed URL).
  - `app/app/create/render/actions.ts` — `startRenderProjectAction` (enqueue
    only), `getRenderStatusAction` (poll), `getLatestExportAction`.
- **Worker (service role, NO session):**
  - `lib/services/render-worker.service.ts` — `claimNextQueuedRenderJob`
    (atomic: flip `queued`→`processing` only if still queued),
    `markRenderJobProcessing/Completed/Failed`, `processRenderJobWithAdmin`,
    `processNextQueuedRenderJob`, `processQueuedRenderJobsLoop`.
  - `workers/render-worker.ts` — entry point (`pnpm worker:render` via tsx);
    loads `.env.local`, polls, handles SIGINT/SIGTERM.
- **Shared, reusable, server-side-only-by-nature (no `server-only` guard so the
  worker can import them):** `lib/render/timeline.ts`,
  `lib/render/ffmpeg-renderer.ts`, `lib/render/environment.ts`,
  `lib/render/constants.ts`.

## Safety

- The worker uses `SUPABASE_SERVICE_ROLE_KEY` (RLS-bypassing) because it runs as
  a trusted process **with no user session**. It is created **inline** in the
  worker service (not via the `server-only` admin module) and **never imported
  by the Next app / client**. Every query is still scoped to the job's own
  `project_id` + `user_id`.
- Secrets are never logged; the worker only prints job/project ids.

## Run locally

```bash
# terminal 1
pnpm dev
# terminal 2 (needs FFmpeg on PATH + SUPABASE_SERVICE_ROLE_KEY in .env.local)
pnpm worker:render
```

Click **Render** in the app → the job is `queued` → the worker picks it up →
the render screen polls and shows progress → on completion it navigates to the
export page with the real MP4 + signed download URL. If the worker is **not**
running, the job stays `queued` and the UI shows *"Queued for rendering — waiting
for the render worker…"*.

## Deployment

- **Web app** (Vercel/serverless ok): only enqueues + polls; never runs FFmpeg.
- **Worker**: deploy on a host that has FFmpeg and can run a long-lived process —
  Docker (`Dockerfile.worker` installs FFmpeg + fonts), a VPS, Render, Fly.io,
  or Railway. Provide `SUPABASE_SERVICE_ROLE_KEY` + the Supabase URL via secrets.

## Reliability (migration 002)

`supabase/migrations/002_render_worker_reliability.sql` hardens the queue:

- **New `render_jobs` columns:** `attempts`, `max_attempts` (default 3),
  `locked_at`, `locked_by`, `next_retry_at`, `worker_started_at`,
  `last_heartbeat_at` (+ indexes on `(status, next_retry_at)`, `(status,
  locked_at)`, `locked_by`).
- **Atomic claim:** `public.claim_next_render_job(worker_id text)` selects the
  oldest eligible `queued` job with **`FOR UPDATE SKIP LOCKED`**, flips it to
  `processing`, increments `attempts`, and stamps `locked_by`/`locked_at`/
  `last_heartbeat_at`/`started_at`. Two workers can never claim the same job.
  Only eligible when `next_retry_at` is null or due.
- **Stale reaper:** `public.requeue_stale_render_jobs(stale_after_seconds int)`
  finds `processing` jobs whose `last_heartbeat_at`/`locked_at` is older than the
  timeout and **requeues** them (with a short `next_retry_at`) if attempts
  remain, else **fails** them. Returns the affected count.
- Both functions are `security definer` and **granted only to `service_role`**
  (the worker); `PUBLIC` execute is revoked so signed-in users can't run them.

Worker behaviour (`lib/services/render-worker.service.ts` +
`workers/render-worker.ts`):

- A stable **worker id** (`RENDER_WORKER_ID`, else `host-pid-random`) claims via
  the RPC. `attempts` is incremented atomically at claim time.
- A **heartbeat** timer (every 30s) refreshes `last_heartbeat_at` while the job
  renders — and only if this worker still owns the row — so the reaper won't
  requeue an actively-rendering job. Render steps also heartbeat.
- **Retry with backoff:** a transient render/upload error requeues the job with
  `next_retry_at = now + min(30·2^(attempt-1), 600)s`; once `attempts >=
  max_attempts` it's failed. Permanent/validation errors (no scenes, project not
  found, FFmpeg unavailable) fail immediately (no retry churn).
- A **reaper** interval (`RENDER_WORKER_REAPER_INTERVAL_MS`, default 60s) calls
  `requeueStaleRenderJobs(RENDER_WORKER_STALE_AFTER_SECONDS, default 900)`.

## Limitations / follow-ups

- [x] Atomic claim with `FOR UPDATE SKIP LOCKED`, retries + backoff, stale-job
      reaper (migration 002).
- [ ] Still **one job at a time per worker** (`RENDER_WORKER_CONCURRENCY`
      reserved). Multiple workers are now safe to run, but test concurrency
      carefully under load.
- [ ] No Redis/BullMQ; this is a Postgres-based queue. Consider a real broker for
      high throughput / priorities / scheduling.
