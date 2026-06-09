# 14 — Rendering Engine Spec

> Status: **Implemented (MVP) with FFmpeg + a background worker.** A real
> 1080×1920 MP4 is rendered from the project's scenes + cached clips + audio,
> uploaded to `video-exports`, and recorded in `render_jobs` / `exports`. As of
> the worker task, the web app **enqueues** jobs and a separate **worker**
> process renders them — see `docs/17-render-worker-spec.md`. This is a
> functional MVP, **not** final cinematic polish.

> NOTE: the "How it works" section below describes the FFmpeg pipeline itself.
> Orchestration moved from a blocking server action to the **render worker**
> (`lib/services/render-worker.service.ts`); the web `startRenderProjectAction`
> now only enqueues, and `RenderProgressScreen` polls `getRenderStatusAction`.

## How it works

1. From the render screen (real project), `startRenderProjectAction(projectId)`
   runs `lib/services/render.service.ts` (server-only).
2. The service verifies ownership, loads scenes (+ `selected_clips`, `captions`,
   `audio_files`), and builds a plan with `lib/render/timeline.ts` (pure):
   1080×1920 @ 30fps, scenes ordered, caption text per scene (caption row → else
   scene title/text), cached-clip locations, and the audio asset.
3. `createRenderJob` inserts a `render_jobs` row (`queued` →`processing`).
4. Assets are downloaded from Storage to a temp dir (cached clips from
   `video-clips-cache`, audio from `audio-files`). A missing clip falls back to a
   solid emotion-color background — render never hard-fails on one missing clip.
5. `lib/render/ffmpeg-renderer.ts` (server-only) runs FFmpeg via
   `child_process`: each scene → an identical-codec 1080×1920 segment
   (scale+crop to fill, optional `drawtext` caption when a font is found), then
   `concat`, then the original audio is muxed (`-shortest`).
6. The MP4 is uploaded to `video-exports/{user}/{project}/final.mp4` (`upsert`);
   `createExportRecord` writes an `exports` row; the job is `completed` and
   `projects.status → rendered`. Temp files are cleaned up.
7. The action returns serializable export metadata + a short-lived **signed
   download URL**. `ExportSuccessScreen` shows it and wires the download button;
   `getLatestExportAction` refreshes it on the export page.

Statuses: `queued` → `processing` → `completed` (or `failed` on error). Errors
mark the job `failed` and surface a friendly retry — scenes/clips are never
deleted.

## FFmpeg binary resolution

`resolveFfmpegBinary()` picks, in order: `process.env.FFMPEG_PATH` → the optional
`ffmpeg-static` package (if installed) → `ffmpeg` on PATH. So the repo builds
without bundling a large binary; the operator provides FFmpeg at runtime. A font
for captions is auto-detected (Windows/Linux/macOS common paths or
`RENDER_FONT_PATH`); if none is found, captions are skipped (video still renders).

## Environment detection & diagnostics

`lib/render/environment.ts` (server-only) exposes `detectRenderEnvironment()`,
`isFfmpegAvailable()`, and `getFfmpegDiagnostics()`. The latter verifies FFmpeg by
actually spawning `ffmpeg -version` (for the PATH case) and returns a serializable
`{ ok, ffmpegAvailable, ffmpegPath?, environment, message }` (no secrets — the
path is a filesystem path).

- **`GET /api/health/render`** returns those diagnostics + a `timestamp`
  (HTTP 200 when available, 503 when not).
- **`renderProject` fails fast**: before creating any `render_jobs`/`exports`
  rows, it checks `isFfmpegAvailable()` and returns the friendly message *"Rendering
  is not available in this environment. Run locally with FFmpeg or use the render
  worker."* — so no broken records are left on environments without FFmpeg.
- `RenderProgressScreen` surfaces that message in its error view (with **Retry**);
  the mock fallback (no `projectId`) is unaffected.

## Local vs production

- **Local / Node server / container:** install FFmpeg (or `pnpm add
  ffmpeg-static`, or set `FFMPEG_PATH`). `GET /api/health/render` should report
  `ok: true`. Rendering works.
- **Vercel / serverless:** **not suitable** — no FFmpeg binary and strict
  time/memory limits. The diagnostics report `environment: "vercel"`, `ok:
  false`, and renders fail gracefully with the message above. Use a dedicated
  worker/container for production rendering.

## MVP limitations / deployment

- **Runtime requires FFmpeg** (system install, `FFMPEG_PATH`, or
  `pnpm add ffmpeg-static`). It is **not** bundled.
- **Synchronous + in-memory**: the render runs inside one server action and
  buffers files — fine for a Node server / container in local dev, but
  **serverless platforms (e.g. Vercel functions) will time out / lack FFmpeg**.
  Move to a worker/queue + a container for production.
- No motion/transitions/color-grade yet; single-line caption overlay; duration
  follows scene timing, trimmed to audio.

## Next steps

- [ ] Background render queue (`render_jobs` progress polled via
      `getRenderStatusAction`) instead of a blocking action.
- [ ] Motion/transition/caption engines; per-scene timing from real audio.
- [ ] A dedicated `app/api/exports/[exportId]/download` route (signed URL is
      currently returned by the action).
