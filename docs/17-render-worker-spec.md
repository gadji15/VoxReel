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

## Limitations / follow-ups

- [ ] Single worker, single job at a time (`RENDER_WORKER_CONCURRENCY` reserved).
- [ ] Polling claim (no row locking / `FOR UPDATE SKIP LOCKED`); fine for 1
      worker, racy for many. Move to a real queue (PG `SKIP LOCKED`, or
      Redis/BullMQ) for multi-worker.
- [ ] No retry/backoff on transient failures; a failed job stays `failed`.
- [ ] No stale-job reaper (a worker that dies mid-job leaves `processing`).
