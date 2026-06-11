# VoxReel

**Turn voice stories into cinematic vertical reels.**

VoxReel is a mobile-first, dark, premium SaaS web app that transforms a spoken
voice story into a cinematic vertical reel for **TikTok**, **Instagram Reels**,
and **YouTube Shorts**. Speak your story — VoxReel transcribes it, breaks it into
emotionally-arced scenes, matches each scene to cinematic stock footage, applies
motion, transitions, and captions, and renders a share-ready 9:16 reel, while
keeping you in control of every scene.

## Troubleshooting

**Health/diagnostic routes** (no secrets):
`/api/health/supabase`, `/api/health/render`, `/api/health/render-queue`,
**`/api/health/auth-config`** (project ref + env presence + reachability),
**`/api/debug/project-flow?projectId=<uuid>`** (auth-required; per-table row
counts for *your* project).

**Production login says "Invalid login credentials"** even though the user
"exists": the browser reaches Supabase fine, so this is almost always **two
different Supabase projects** — the account lives in the project your *localhost*
`.env.local` points to, not the one your *Vercel* env vars point to (or vice
versa). Open `/api/health/auth-config` on **both** localhost and the deployed URL
and compare `projectRef`. If they differ, point both at the same project (or
re-create the user / reset its password in the correct project; also check
Auth → Providers → "Confirm email").

**Localhost shows some "fake" data:** the dashboard **stats**, **Trending**, and
**waveforms** are intentionally cosmetic mock; the greeting now uses your real
name/email. The create flow runs the **real** pipeline only when you open it with
a real `?projectId=` (use **New Reel** / a project card) **and** upload a file via
the **Upload Audio** tab — **Record Voice** is still mock. Verify progress with
`/api/debug/project-flow`.

**Every create button uses one flow:** the dashboard hero/empty-state, the
Projects "New Reel"/empty-state, **and the nav plus / sidebar "New Reel"** all
call `createNewProjectAction()` → a real `projects` row → redirect to
`/app/create/upload?projectId=<uuid>`. No in-app create button enters the flow
without a `projectId`. (Direct visits to `/app/create/upload` still mock-fall-back
for dev, with a console warning.)

## Current status

> ⚠️ **Frontend-only UI skeleton.** This repository (originally generated with
> [v0](https://v0.app)) contains the full interface and flow, driven entirely by
> **mock data**. There is **no backend yet** — no authentication, file upload,
> transcription, AI, or rendering. Progress/analysis/render screens are animated
> simulations.

See [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs) for the product vision and the
specs that guide future development.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Framer Motion** (animation) · **lucide-react** (icons)
- shadcn-style UI components + **Base UI**
- **pnpm** package manager

## Run locally

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Build & lint

```bash
pnpm lint     # ESLint
pnpm build    # production build (also type-checks)
pnpm start    # serve the production build
```

## Project structure

```
app/                 # Next.js App Router
  page.tsx           # public landing page (/)
  app/               # frontend-only app section (shell + routed screens)
    layout.tsx       # VoxReelAppShell (sidebar + bottom nav)
    page.tsx         # /app (dashboard)
    projects/        # /app/projects
    settings/        # /app/settings
    create/          # /app/create/* flow (upload → … → export, scene/[sceneId])
components/
  layout/            # VoxReelAppShell
  providers/         # CreateFlowProvider (shared create-flow draft state)
  screens/           # full-screen views (landing, home, storyboard, preview, …)
  voxreel/           # VoxReel building blocks (SceneCard, BottomSheet, phone frame…)
  ui/                # generic primitives
lib/
  routes.ts          # route constants + sceneRoute() helper
  emotions.ts        # emotion → color map (single source of truth)
  types.ts           # shared UI types (incl. create-flow draft state)
  mock-data.ts       # mock content driving the UI
docs/                # product + technical specs (00–16)
supabase/
  migrations/        # SQL schema migrations (not run automatically)
```

Navigation uses real App Router routes. Each `/app/**` page is a thin wrapper
that renders an existing screen component and wires its callbacks to
`useRouter()`. Paths live in [`lib/routes.ts`](lib/routes.ts).

The `/app/create/*` flow shares one typed **draft project** via
`CreateFlowProvider` (React Context + reducer) — initialized from mock data and
persisted to `localStorage` (best-effort, client-only). The **entire create-flow
lifecycle is wired to this state** (all mock):

- **Upload** stores audio metadata, **Style** stores story/language/footage/
  caption settings, **Analysis** simulates the pipeline then populates the
  transcript + scenes, **Storyboard/Transcript/Scene editor/Preview** read and
  edit that shared state, **Rendering** drives `renderStatus` and writes export
  metadata, and **Export** displays it.

It holds draft UI state only; there is still no backend, real upload,
transcription, AI, or rendering.

## Database (Supabase) — schema only, not connected

The initial database schema lives in
[`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql):
profiles, projects, audio files, transcript segments, scenes, captions, clip
candidates, selected clips, render jobs, exports, and event-history tables —
plus indexes, `updated_at` triggers, a new-user → profile trigger, Row Level
Security policies, and private storage buckets.

> ⚠️ The migration is **not executed automatically** and the **frontend is not
> connected to Supabase yet**. To apply it, create a Supabase project and run the
> SQL manually (SQL Editor) or via the Supabase CLI — see
> [`supabase/README.md`](supabase/README.md). Copy [`.env.example`](.env.example)
> to `.env.local` and fill in keys when you begin wiring the backend.

### Supabase client layer

A connection layer exists under [`lib/supabase/`](lib/supabase) (using
`@supabase/supabase-js` + `@supabase/ssr`):

- `createSupabaseBrowserClient()` — Client Components (public URL + anon key).
- `createSupabaseServerClient()` — Server Components / Route Handlers /
  Server Actions (session-aware, cookie-based, anon key).
- `createSupabaseAdminClient()` — **server-only** service-role client
  (`import 'server-only'`; imported directly from `lib/supabase/admin`, never
  from a client component; **never** exposed to the browser).
- `database.types.ts` — typed `Database` for the schema.

Health check: **`GET /api/health/supabase`** returns `{ ok, message, timestamp }`
after a light `profiles` query.

### Authentication (Supabase Auth)

Email/password auth is wired up and **`/app/*` is protected**:

- `middleware.ts` refreshes the Supabase session and redirects signed-out users
  from `/app/*` to `/login?next=…`; signed-in users are bounced away from
  `/login` and `/signup` to `/app`.
- Public routes: `/`, `/login`, `/signup`, `/auth/callback`,
  `/api/health/supabase`.
- Pages: [`/login`](app/login/page.tsx), [`/signup`](app/signup/page.tsx);
  email-confirmation/OAuth handled by [`/auth/callback`](app/auth/callback/route.ts).
- Sign-out lives in **Settings** (`SignOutButton`). Server helpers:
  `getCurrentUser()` / `requireUser()` in `lib/supabase/auth.ts` (server-only).

> Auth gates the routes, but the **create flow itself is still mock-driven**
> (see project persistence below).

### Project persistence (first real data)

The dashboard and projects library now read **real Supabase projects** for the
signed-in user:

- `lib/services/projects.service.ts` (server-only) — `getCurrentUserProjects`,
  `getRecentProjects`, `getProjectById`, `createProject`, `archiveProject`,
  `deleteProject` (all scoped to `auth.uid()`).
- `lib/mappers/project.mapper.ts` — maps DB rows to the UI `Project` shape
  (real `status`/duration; `views` is never fabricated).
- `app/app/projects/actions.ts` — server actions `createNewProjectAction`
  (creates a row → redirects to `/app/create/upload?projectId=…`),
  `archiveProjectAction`, `deleteProjectAction`.
- `app/app` and `app/app/projects` pages fetch server-side; `HomeDashboard` /
  `ProjectsScreen` take an optional `projects` prop (mock fallback for dev).
  Empty state shown when a real user has no projects.
- Settings shows the **authenticated user's** email / name.

### Create-flow hydration & draft persistence

`CreateFlowProvider` now **hydrates from a real project** and persists draft edits:

- `lib/services/create-flow.service.ts` (server-only) — load a project's draft +
  persist settings / transcript / scenes / captions (REPLACE strategy, no dupes).
- `lib/mappers/create-flow.mapper.ts` — Supabase rows ↔ provider state.
- `app/app/create/actions.ts` — `getCreateFlowDraftAction`,
  `updateProjectSettingsAction`, `saveTranscriptAction`, `saveScenesAction`,
  `saveAnalysisAction`.
- A client bridge (`CreateFlowProjectBridge`, mounted in `app/app/create/layout.tsx`)
  reads `?projectId=…` and hydrates the provider (local draft first, else server;
  invalid/not-owned → redirect to `/app/projects`).
- `projectId` is **preserved across every create step** via
  `lib/navigation/create-flow-url.ts` (`withProjectId`).
- localStorage drafts are now **project-scoped** (`voxreel:create-flow-draft:<id>`),
  so drafts never mix between projects.

Persistence save points (mock content, real persistence): style settings save
live; analysis completion replaces transcript+scenes+captions; leaving the
transcript saves transcript; leaving the storyboard / scene editor saves scenes.

### Real audio upload

The upload step is now **real**: in `AudioUploadScreen`, choosing a file (with a
`projectId` present) validates it, reads its duration, uploads it from the
browser to the private **`audio-files`** bucket at
`{user_id}/{project_id}/original.{ext}`, writes the **`audio_files`** row, sets
`projects.status = 'audio_uploaded'`, and stores the real metadata in the
provider before continuing to `/app/create/style?projectId=…`.

- `lib/upload/audio-upload.ts` — validation (mime/ext, ≤50 MB, 5–180s),
  client-side duration extraction, browser upload (anon client only).
- `lib/services/audio.service.ts` (server-only) + `app/app/create/audio/actions.ts`
  — persist metadata (REPLACE strategy); never use the service role.
- With **no** `projectId`, the mock fallback is preserved.

### Real transcription (OpenAI Whisper)

On the analysis step, a real project with uploaded audio is **transcribed for
real**:

- `lib/openai/client.ts` (server-only) + `lib/services/transcription.service.ts`
  (server-only) download the audio from the `audio-files` bucket and call OpenAI
  `whisper-1` (`verbose_json`, segment timestamps).
- Timestamped rows are saved to **`transcript_segments`** (REPLACE strategy — no
  duplicates on re-run); `projects.status` → `transcribed`.
- `app/app/create/transcription/actions.ts` exposes
  `transcribeProjectAudioAction` / `getTranscriptAction`.
- `AnalysisProgressScreen` runs it (steps: Preparing audio → Transcribing voice →
  Saving transcript → Detecting emotions → Building storyboard), shows a friendly
  error + retry on failure, and feeds the real transcript into the provider. The
  transcript screen + hydration show the saved real text.

`OPENAI_API_KEY` is **server-only** (never `NEXT_PUBLIC`, never sent to the
browser). With no `projectId`/audio, the mock flow is preserved.

### Real story analysis & scene splitting (OpenAI)

After transcription, the analysis step now generates **real scenes from the real
transcript**:

- `lib/story-analysis/` (types + prompt) and
  `lib/services/story-analysis.service.ts` (server-only) send the persisted
  `transcript_segments` to OpenAI (`gpt-4o-mini`, structured `json_schema`
  output) and get back emotion-aware scenes (timestamps, emotion, intensity,
  `visual_intent`, `search_query`, motion/transition).
- Output is normalized/validated, then **REPLACES** the `scenes` rows (only when
  valid); `projects.status → storyboard_ready`. The storyboard shows these real
  scenes (and they persist on refresh / reopen).
- `app/app/create/story-analysis/actions.ts` exposes
  `analyzeProjectStoryAction` / `getProjectScenesAction`.
- `AnalysisProgressScreen` runs transcription (reusing an existing transcript to
  avoid re-transcribing) then story analysis; friendly error + retry on failure,
  and it never overwrites existing scenes with empty output.

`OPENAI_API_KEY` stays **server-only**. With no `projectId`/audio, the mock flow
is preserved.

### Real stock-video search (Pexels / Pixabay)

After scene splitting, the analysis step searches **real stock footage** per
scene:

- `lib/stock-video/` (types, `pexels.ts`, `pixabay.ts`, `scoring.ts`, all
  server-only for the provider clients) + `lib/services/stock-video.service.ts`
  query providers using each scene's `search_query`, normalize + score (0–100,
  vertical/duration/resolution fit), **REPLACE** `clip_candidates`, and pick the
  best into `selected_clips`. `projects.status → clips_ready`.
- `app/app/create/stock-video/actions.ts` exposes
  `searchStockVideosForProjectAction`, `searchStockVideosForSceneAction`,
  `getClipCandidatesForSceneAction`, `selectClipCandidateAction`.
- Scenes hydrate with the selected clip (title + match + thumbnail/preview URLs);
  the **Replace Clip** sheet now lists the **real candidates** and persists the
  user's choice.

Provider keys (`PEXELS_API_KEY` / `PIXABAY_API_KEY`) are **server-only**. If a key
is missing the other provider is used; if both are missing, search is skipped
with a friendly warning and scenes stay usable. No `projectId`/audio → mock flow.

### Selected-clip caching (Supabase Storage)

After stock search, each scene's **selected clip is downloaded server-side and
cached** in the private `video-clips-cache` bucket (ready for the renderer):

- `lib/services/clip-cache.service.ts` (server-only) fetches the provider URL,
  validates status/content-type, enforces a 100 MB cap, uploads to
  `video-clips-cache/{user}/{project}/{scene}/{selectedClip}.mp4` (`upsert`), and
  records `selected_clips.storage_bucket` / `storage_path` — **`source_url` stays
  unchanged**.
- `app/app/create/clip-cache/actions.ts` exposes
  `cacheSelectedClipsForProjectAction`, `cacheSelectedClipAction`,
  `getCachedSelectedClipsAction`. The analysis screen runs caching automatically
  after stock search (non-fatal — failures keep provider links and never delete
  scenes/clips). Idempotent: re-running replaces, never duplicates.

### Rendering (FFmpeg MVP)

A real **1080×1920 MP4** is rendered server-side from the project's scenes,
cached clips, and audio:

- `lib/render/` (types, pure `timeline.ts`, server-only `ffmpeg-renderer.ts`) +
  `lib/services/render.service.ts` build the plan, run FFmpeg (scale/crop each
  scene to 9:16 → concat → mux audio, optional caption overlay), upload to
  `video-exports/{user}/{project}/final.mp4`, and record `render_jobs` +
  `exports` (`projects.status='rendered'`).
- `app/app/create/render/actions.ts` — `startRenderProjectAction`,
  `getRenderStatusAction`, `getLatestExportAction`. `RenderProgressScreen` runs a
  real render for a real project (mock fallback + retry-on-error otherwise);
  `ExportSuccessScreen` shows real metadata and a short-lived **signed download
  URL**.
- **FFmpeg is required at runtime** (not bundled): set `FFMPEG_PATH`, install
  `ffmpeg-static` (`pnpm add ffmpeg-static`), or have `ffmpeg` on PATH. See
  [`docs/14-rendering-engine-spec.md`](docs/14-rendering-engine-spec.md).

### Render queue + worker

Rendering runs in a **background worker**, not the web request:

- The web app **enqueues** a `render_jobs` row (`startRenderProjectAction` →
  `lib/services/render-queue.service.ts`); `RenderProgressScreen` **polls**
  `getRenderStatusAction` and shows real `render_jobs.progress` (or "waiting for
  the render worker" while `queued`).
- The **worker** (`pnpm worker:render`, `workers/render-worker.ts` via tsx)
  claims queued jobs and runs FFmpeg with the **service role**
  (`lib/services/render-worker.service.ts`) — server-side only, never imported by
  the app/browser. Run it on a host with FFmpeg (see
  [`Dockerfile.worker`](Dockerfile.worker)).

```bash
# terminal 1
pnpm dev
# terminal 2 (needs FFmpeg + SUPABASE_SERVICE_ROLE_KEY in .env.local)
pnpm worker:render
```

The web app only enqueues/polls, so it is **serverless-safe**; deploy the worker
on Docker/VPS/Fly/Railway. See
[`docs/17-render-worker-spec.md`](docs/17-render-worker-spec.md).

**Reliability (migration 002 — run it in Supabase):**
[`supabase/migrations/002_render_worker_reliability.sql`](supabase/migrations/002_render_worker_reliability.sql)
adds attempt/lock/heartbeat columns to `render_jobs` plus two `service_role`-only
functions — `claim_next_render_job` (atomic `FOR UPDATE SKIP LOCKED` claim) and
`requeue_stale_render_jobs` (stale-job requeue/fail). The worker now claims via
the RPC, **heartbeats** while rendering, **retries with backoff** on transient
errors (fails after `max_attempts`), and runs a **stale reaper**. **Running
multiple workers is now safe** (each still processes one job at a time); test
concurrency under load before relying on it. No Redis/BullMQ yet.

**Monitoring:** `GET /api/health/render-queue` returns aggregate queue health —
`{ ok, queue: { queued, processing, failedRecent, staleProcessing,
oldestQueuedAgeSeconds, … }, worker: { healthy, message }, ffmpeg, timestamp }`
(**200** healthy / **503** when stale jobs or a stuck queued backlog). It exposes
**only counts/timestamps — no secrets, no other-user content**.
`GET /api/health/render` stays FFmpeg-only. An auth-only diagnostics page at
**`/app/settings/render-health`** (linked from Settings) shows the stats, FFmpeg
availability, and the signed-in user's own recent renders.
- **Render diagnostics:** `lib/render/environment.ts` detects FFmpeg + the runtime
  (`local`/`vercel`/`node-server`). **`GET /api/health/render`** returns
  `{ ok, ffmpegAvailable, ffmpegPath?, environment, message, timestamp }` (no
  secrets; 503 when FFmpeg is missing). If FFmpeg isn't available, a render fails
  fast with a clear message (no broken `render_jobs`/`exports` rows) and the
  render screen shows it with Retry. **Vercel/serverless is not suitable for
  FFmpeg rendering.**

> Still MVP, not final cinematic polish: no motion/transitions/color-grade yet,
> single-line captions, and a blocking render (no queue). A full **captions
> engine** and render polish are the next milestones.

## Current limitations

- No backend, database, or authentication.
- No real audio upload, recording, or transcription.
- No real AI (storytelling engine, clip matching, captions are mocked).
- No real rendering/export — the "rendered" file is a mock.
- The `/app/*` routes are not auth-protected yet (frontend-only grouping).

## Roadmap

The planned path from UI skeleton to product (details in
[`docs/15-mvp-roadmap.md`](docs/15-mvp-roadmap.md)):

1. **Data layer** — Supabase (Auth + Postgres + Storage).
2. **Ingest** — audio upload/recording + transcription.
3. **Intelligence** — storytelling engine, stock-video search, captions.
4. **Production** — motion/transition engine, rendering (Remotion + FFmpeg).
5. **Polish & monetization** — plans, limits, analytics.

## Notes for future development

- Keep the dark, premium, cinematic, mobile-first design intact.
- Do not introduce backend logic, real API calls, or rendering without explicit
  intent — see the "must not modify" list in [`CLAUDE.md`](CLAUDE.md).
- Mock data must stay internally consistent (scene counts match storyboards;
  featured runtime is `1:18` / 8 scenes).
- Prefer the shared types in [`lib/types.ts`](lib/types.ts) over inline shapes.

---

Made for storytellers.
