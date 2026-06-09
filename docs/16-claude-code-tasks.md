# 16 — Claude Code Tasks

> Status: **Working log.** Backlog of well-scoped tasks for Claude Code, plus a
> record of what has been done. Read `CLAUDE.md` before starting any task.

## Ground rules

- Do **not** implement auth, file upload, transcription, real API calls, or
  rendering without explicit instruction.
- Preserve the dark, premium, cinematic, mobile-first design.
- Keep the UI working and the build green.

## Diagnostics (mock vs real, prod auth)

**Intentionally still mock (cosmetic — harmless, do NOT block the pipeline):**
dashboard **stats** ("Total Views/Reels Made/AI Accuracy"), **Trending styles**,
placeholder **waveforms**, the upload tab's **demo file** card, and **Record
Voice** mode (records nothing real → mock metadata). The dashboard greeting now
shows the **real** signed-in name/email (was hardcoded "Alex Moreno"); Settings
already showed the real user.

**Real-pipeline gating (the "quickly returns mock" symptom):** the create flow
goes REAL only when a real `projectId` exists AND real audio was uploaded
(`audio.storagePath` set). It falls back to mock when: no `projectId`, **Record**
mode, or no file chosen. **Bug fixed:** `AudioUploadScreen` read `projectId` from
the *provider* (which lags during hydration), so a real Upload could silently go
mock — it now reads the **URL `?projectId=`** (authoritative). `projectId` is
correctly preserved through every create step (verified).

**Production "Invalid login credentials":** the browser client reaches the right
project (`invalid_credentials`, CORS ok), so env vars are set in Vercel. Most
likely cause: **localhost and production point to DIFFERENT Supabase projects**,
so the account exists in one but not the other — or email-confirmation / wrong
password. Diagnose with `GET /api/health/auth-config` (compare `projectRef` on
localhost vs the deployed URL) and `GET /api/debug/project-flow?projectId=…`.

## Done

## Done

- [x] Rename package to `voxreel`.
- [x] Create `/docs` (this set) and root `CLAUDE.md`.
- [x] Professional `README.md`.
- [x] Mock-data consistency (scene totals match; durations 60–90s).
- [x] Shared types in `lib/types.ts`; `SceneCard` / `ProjectCard` use them.
- [x] App Router migration: `view` state machine replaced by real routes under
      `app/app/*`, shared `VoxReelAppShell`, and `lib/routes.ts` constants.
- [x] Centralized emotion → color map in `lib/emotions.ts` (`getEmotionColor`),
      mock data updated to use it.
- [x] Create Flow Provider: shared typed draft state for `/app/create/*`
      (`components/providers/CreateFlowProvider.tsx`, Context + reducer,
      localStorage persistence). Connected: Style, Transcript, Storyboard,
      Scene editor (caption/motion/transition/clip/lock + missing-scene
      fallback), Preview. Still frontend-only.
- [x] Full create-flow lifecycle connected (still frontend-only / mock):
      AudioUpload (`setAudioMetadata`), StyleSelection (language / footage /
      caption controls), Analysis (mock pipeline populates transcript + scenes),
      Rendering (`renderStatus` + `setExportMetadata`), Export (reads export
      metadata with fallbacks). Added provider actions `setExportMetadata` and
      `updateProjectTitle`; added `ExportMetadata.createdAt`.
- [x] Initial Supabase schema migration
      (`supabase/migrations/001_initial_schema.sql`): 12 tables, indexes,
      `updated_at` + new-user triggers, RLS policies, private storage buckets.
      Added `.env.example` and `supabase/README.md`. **Not executed
      automatically; frontend NOT connected to Supabase.**
- [x] Supabase client layer (`lib/supabase/`): `@supabase/supabase-js` +
      `@supabase/ssr` + `server-only`. Browser, session-aware server, and
      server-only admin clients; validated `env.ts`; hand-written
      `database.types.ts`; barrel `index.ts` (admin intentionally excluded).
      Diagnostic route `GET /api/health/supabase`. Service role stays
      server-only. **Still mock-driven — provider/screens unchanged.**
- [x] Supabase Auth (email/password): `middleware.ts` session refresh + `/app/*`
      protection (redirects to `/login?next=…`; bounces signed-in users from
      `/login`/`/signup`). `app/login`, `app/signup`, `app/auth/callback`;
      `components/auth/*` (AuthCard/LoginForm/SignupForm/SignOutButton);
      sign-out wired into Settings; `lib/supabase/auth.ts`
      (`getCurrentUser`/`requireUser`). **CreateFlowProvider still mock-driven;
      no project persistence/CRUD.**

- [x] Project persistence (first real data): `lib/services/projects.service.ts`
      (server-only CRUD), `lib/mappers/project.mapper.ts`,
      `app/app/projects/actions.ts` (create/archive/delete). Dashboard & Projects
      pages fetch real Supabase projects server-side; `HomeDashboard`/
      `ProjectsScreen` take an optional `projects` prop (mock fallback). Create
      buttons make a real row and redirect to
      `/app/create/upload?projectId=…`; opening a project →
      `/app/create/storyboard?projectId=…`. Settings shows the real user.
      **Create flow still mock-driven; `projectId` only carried in the URL.**

- [x] Create-flow hydration + draft persistence: `CreateFlowProvider` hydrates
      from `?projectId=<uuid>` via `CreateFlowProjectBridge` (local-first, else
      `getCreateFlowDraftAction`; invalid → redirect to /app/projects).
      `lib/services/create-flow.service.ts` (server-only) + `app/app/create/actions.ts`
      persist settings/transcript/scenes/captions (REPLACE strategy);
      `lib/mappers/create-flow.mapper.ts` maps rows ↔ state; `withProjectId`
      preserves the param across steps; localStorage is project-scoped. Content
      is still mock (no real audio/transcription/AI/clips/rendering).

- [x] Real audio upload: browser → Supabase Storage (`audio-files/{user}/{project}/
      original.ext`) via `lib/upload/audio-upload.ts` (validate mime/ext, ≤50 MB,
      5–180s, client duration). `lib/services/audio.service.ts` +
      `app/app/create/audio/actions.ts` upsert `audio_files` and set
      `projects.status='audio_uploaded'`; `getCreateFlowDraft` hydrates audio.
      Mock fallback preserved when no `projectId`. Transcription still mock.

- [x] Real transcription (OpenAI Whisper MVP): `lib/openai/client.ts`
      (server-only) + `lib/services/transcription.service.ts` download audio from
      Storage and call `whisper-1` (`verbose_json`, segment timestamps), REPLACE
      `transcript_segments`, set `projects.status='transcribed'`. Actions in
      `app/app/create/transcription/actions.ts`; `AnalysisProgressScreen` runs it
      (error + retry). `OPENAI_API_KEY` is server-only. Scenes still mock.

- [x] Real story analysis & scene splitting (OpenAI structured output):
      `lib/story-analysis/` (types + prompt) + `lib/services/story-analysis.service.ts`
      (server-only) turn `transcript_segments` into validated scenes
      (`gpt-4o-mini`, `json_schema` strict), REPLACE the `scenes` rows, and set
      `projects.status='storyboard_ready'`. Actions in
      `app/app/create/story-analysis/actions.ts`; `AnalysisProgressScreen` runs
      transcription (reuses existing transcript) then analysis. Scenes persist +
      hydrate. Mock fallback kept; existing scenes never clobbered on failure.

- [x] Stock-video search (Pexels/Pixabay MVP): `lib/stock-video/` (types +
      server-only provider clients + scoring) + `lib/services/stock-video.service.ts`
      query per scene via `search_query`, score, REPLACE `clip_candidates`,
      select best into `selected_clips`, set `projects.status='clips_ready'`.
      Actions in `app/app/create/stock-video/actions.ts`; analysis screen runs it;
      scenes hydrate with selected clip; Replace Clip sheet shows real candidates.
      Keys server-only; missing keys handled gracefully.

- [x] Selected-clip caching: `lib/services/clip-cache.service.ts` (server-only)
      downloads each scene's selected clip and caches it to the private
      `video-clips-cache` bucket (`{user}/{project}/{scene}/{clip}.mp4`, upsert,
      100 MB cap, content-type checks), recording
      `selected_clips.storage_bucket`/`storage_path` (source_url unchanged).
      Actions in `app/app/create/clip-cache/actions.ts`; analysis screen caches
      after stock search (non-fatal, idempotent). See `docs/10-clip-cache-spec.md`.

- [x] Rendering (FFmpeg MVP): `lib/render/` (types + pure `timeline.ts` +
      server-only `ffmpeg-renderer.ts`) + `lib/services/render.service.ts` build a
      1080×1920 plan and render via FFmpeg (scale/crop → concat → mux audio,
      optional caption overlay), upload to `video-exports`, write `render_jobs` +
      `exports`, set `projects.status='rendered'`. Actions in
      `app/app/create/render/actions.ts`; `RenderProgressScreen` /
      `ExportSuccessScreen` use real metadata + a signed download URL (mock
      fallback kept). FFmpeg resolved at runtime (not bundled); synchronous MVP.
      See `docs/14-rendering-engine-spec.md`.

- [x] Render diagnostics & safety: `lib/render/environment.ts` (server-only)
      `detectRenderEnvironment` / `isFfmpegAvailable` / `getFfmpegDiagnostics`
      (spawns `ffmpeg -version`; classifies local/vercel/node-server). New route
      `GET /api/health/render` returns `{ ok, ffmpegAvailable, ffmpegPath?,
      environment, message, timestamp }` (no secrets). `renderProject` checks
      availability **before** creating job/export rows and fails with a friendly
      message; `RenderProgressScreen` surfaces it with Retry. Documents that
      Vercel/serverless is unsuitable for FFmpeg.

- [x] Render queue + worker: web `startRenderProjectAction` now **enqueues** a
      `render_jobs` row (`lib/services/render-queue.service.ts`, deduped) and the
      render screen **polls** `getRenderStatusAction`. A standalone worker
      (`workers/render-worker.ts`, `pnpm worker:render` via tsx +
      `lib/services/render-worker.service.ts`, service role) claims queued jobs
      and runs FFmpeg off the request path. Shared render modules dropped their
      `server-only` guard so the worker can reuse them (still un-bundleable in the
      browser via `node:*`). Added `Dockerfile.worker` + worker env vars. See
      `docs/17-render-worker-spec.md`.

- [x] Render worker reliability (migration `002_render_worker_reliability.sql`):
      `render_jobs` gains attempt/lock/heartbeat columns + indexes; `service_role`
      RPCs `claim_next_render_job` (atomic `FOR UPDATE SKIP LOCKED`, increments
      attempts) and `requeue_stale_render_jobs`. Worker claims via RPC,
      heartbeats during render, retries with backoff (fails after max_attempts),
      and runs a stale reaper (worker id + env knobs). Multiple workers are safe;
      per-worker concurrency still 1. See `docs/17-render-worker-spec.md`.
      **Run migration 002 in Supabase.**

- [x] Render queue monitoring: `lib/services/render-monitoring.service.ts`
      (server-only, admin) aggregate stats + health summary;
      `GET /api/health/render-queue` (200/503, counts only — no secrets/other-user
      data); FFmpeg-only `GET /api/health/render` kept separate; auth-only
      `/app/settings/render-health` diagnostics page (aggregate + the user's own
      jobs), linked from Settings. See `docs/17-render-worker-spec.md`.

## Next recommended tasks

- [ ] Load-test multiple concurrent workers; consider `RENDER_WORKER_CONCURRENCY`
      > 1 and/or a real broker (Redis/BullMQ) for priorities/scheduling/throughput.
- [ ] Real caption engine (multi-line, styled, timed) consumed by the renderer.
- [ ] Add archive/delete affordances to the project cards (actions already exist).
- [ ] Add a drag-to-reorder UI for the storyboard (reducer action already exists).
- [ ] Define the real backend seam (Supabase + async jobs) that will replace the
      mock audio/analysis/render lifecycle behind the same provider actions.
- [ ] Extract design tokens (colors/typography) into documented constants.
- [ ] Add lightweight component-level docs/stories for the `voxreel/*` components.

## Backlog (blocked on product decisions / backend)

- [ ] Wire Supabase (after schema in doc 05 is finalized).
- [ ] Implement upload/transcription/storytelling/render per their specs.

## TODO

- [ ] Keep this log updated as tasks are completed.
