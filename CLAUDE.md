# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

## What VoxReel is

**VoxReel** is a mobile-first, dark, premium SaaS web app that turns spoken voice
stories into cinematic vertical reels for **TikTok, Instagram Reels, and YouTube
Shorts**. A creator speaks a story; VoxReel transcribes it, segments it into
emotionally-arced scenes, matches each scene to cinematic stock footage, applies
motion / transitions / captions, and renders a share-ready 9:16 reel — while
keeping the creator in full control of every scene.

See `docs/00-vision-produit.md` for the full vision.

## Product vision (short)

Speak the story. VoxReel handles the rest. Target output: a polished
**60–90 second** cinematic vertical reel, produced entirely from a phone.

## Current status — IMPORTANT

This repo is a **frontend-only UI skeleton**, generated with v0.

- All data is **mock data** in `lib/mock-data.ts` (typed by `lib/types.ts`).
- There is **no backend**: no auth, no database, no file upload, no transcription,
  no AI calls, no rendering. Progress screens are animated simulations.
- Navigation uses the **Next.js App Router** (real routes under `app/`). The old
  single-page `view` state machine has been removed. Route paths are centralized
  in `lib/routes.ts`. `/app/*` is now **auth-protected** by `middleware.ts`
  (Supabase session required); its *content* is still mock-driven.
- The create flow shares one typed draft via **`CreateFlowProvider`** (React
  Context + reducer) in `components/providers/`, wired in
  `app/app/create/layout.tsx`. localStorage is now **project-scoped**
  (`voxreel:create-flow-draft:<projectId>`), so drafts never mix.
- **Create-flow ↔ Supabase hydration & draft persistence.** With a real
  `?projectId=<uuid>`, the provider hydrates from the DB: `CreateFlowProjectBridge`
  (in the create layout, under a Suspense boundary) reads the URL param and loads
  the draft (local cache first, else `getCreateFlowDraftAction`; invalid/not-owned
  → redirect to `/app/projects`). `projectId` is preserved across every step via
  `lib/navigation/create-flow-url.ts` (`withProjectId`). Persistence (server-only
  `lib/services/create-flow.service.ts` + `app/app/create/actions.ts`,
  REPLACE strategy): style settings save live; analysis completion saves
  transcript+scenes+captions; leaving transcript saves transcript; leaving
  storyboard/scene editor saves scenes.
- **Real audio upload.** `AudioUploadScreen` (with a `projectId`) validates +
  uploads the file from the browser to the private `audio-files` bucket
  (`{user_id}/{project_id}/original.{ext}`) via the anon client, then
  `saveAudioMetadataAction` writes the `audio_files` row and sets
  `projects.status='audio_uploaded'`. Helpers: `lib/upload/audio-upload.ts`
  (validate/duration/upload), `lib/services/audio.service.ts` (server-only),
  `app/app/create/audio/actions.ts`. `getCreateFlowDraft` hydrates the audio row.
  No `projectId` → mock fallback. Never use the service role / `lib/supabase/admin`
  for uploads.
- **Real transcription (OpenAI Whisper).** `lib/openai/client.ts` (server-only,
  `OPENAI_API_KEY` — never `NEXT_PUBLIC`, never browser) +
  `lib/services/transcription.service.ts` (server-only) download the project's
  audio from Storage and call `whisper-1` (`verbose_json`, segment timestamps),
  REPLACE `transcript_segments`, and set `projects.status='transcribed'`
  (`audio_uploaded`→`transcribing`→`transcribed`/`failed`). Actions:
  `app/app/create/transcription/actions.ts`. `AnalysisProgressScreen` runs real
  transcription when a project has uploaded audio (friendly error + retry),
  feeds the real transcript to the provider, then runs real story analysis.
  No `projectId`/audio → mock fallback.
- **Real story analysis & scene splitting (OpenAI).** `lib/story-analysis/`
  (types + prompt) + `lib/services/story-analysis.service.ts` (server-only) send
  the persisted `transcript_segments` to `gpt-4o-mini` (Chat Completions,
  `response_format: json_schema` strict), normalize/validate scenes (sort +
  reindex, `end>start`, intensity 0–100, hex color, motion/transition → UI preset
  names, `search_query` kept for stock search), then REPLACE the `scenes` rows
  and set `projects.status='storyboard_ready'`. Actions:
  `app/app/create/story-analysis/actions.ts`. The storyboard now shows real
  scenes; existing scenes are never overwritten with empty/invalid output.
- **Real stock-video search (Pexels/Pixabay).** `lib/stock-video/` (types,
  `pexels.ts`/`pixabay.ts`/`scoring.ts` — provider clients are server-only) +
  `lib/services/stock-video.service.ts` (server-only) query providers per scene
  using `scene.search_query`, normalize + score (0–100), REPLACE
  `clip_candidates`, select the best into `selected_clips`, and set
  `projects.status='clips_ready'`. Actions:
  `app/app/create/stock-video/actions.ts`. Scenes hydrate with the selected clip
  (title/match/thumbnail via `getCreateFlowDraft` + mappers; `Scene` gained
  optional `dbId`/`clip*Url` fields). The **Replace Clip** sheet lists real
  candidates and persists the choice. Keys `PEXELS_API_KEY`/`PIXABAY_API_KEY` are
  **server-only**; missing keys → use the other / skip with a warning (scenes
  stay usable).
- **Selected-clip caching.** `lib/services/clip-cache.service.ts` (server-only)
  downloads each scene's selected clip from its provider URL, validates
  status/content-type + a 100 MB cap, uploads to the private `video-clips-cache`
  bucket at `{user}/{project}/{scene}/{selectedClip}.mp4` (`upsert`), and records
  `selected_clips.storage_bucket`/`storage_path` (`source_url` unchanged).
  Actions: `app/app/create/clip-cache/actions.ts`. The analysis screen caches
  automatically after stock search (non-fatal; idempotent — one failing clip
  never aborts the run). Scenes hydrate `clipCachedBucket`/`clipCachedPath`.
- **Real rendering (FFmpeg MVP).** `lib/render/` (`types.ts`, pure
  `timeline.ts`, server-only `ffmpeg-renderer.ts`) + `lib/services/render.service.ts`
  (server-only) build a 1080×1920 plan from scenes + cached clips + audio, run
  FFmpeg (`child_process`) to scale/crop each scene, concat, and mux audio,
  upload the MP4 to `video-exports/{user}/{project}/final.mp4`, and write
  `render_jobs` + `exports` (status `queued`→`processing`→`completed`/`failed`;
  `projects.status='rendered'`). Actions: `app/app/create/render/actions.ts`.
  `RenderProgressScreen` runs it for real projects (mock fallback otherwise, with
  retry on error); `ExportSuccessScreen` shows real metadata + a short-lived
  signed download URL. FFmpeg is resolved at runtime (`FFMPEG_PATH` →
  `ffmpeg-static` if installed → PATH) — **not bundled**; synchronous/in-memory
  MVP (needs a Node server/container, not serverless). **Captions engine + render
  polish still pending.**
- **Render queue + worker.** Rendering is now **enqueue + background worker**,
  not a blocking action. Web (session/RLS): `lib/services/render-queue.service.ts`
  (`enqueueRenderProject` — dedupes in-flight jobs — `getLatestRenderJobForProject`,
  `getRenderJobById`) + `render.service.ts` (`getLatestExport`).
  `startRenderProjectAction` only **enqueues** a `render_jobs` row (`queued`);
  `RenderProgressScreen` polls `getRenderStatusAction` every 2.5s and shows real
  `render_jobs.progress` (or "waiting for the render worker" while `queued`).
  Worker (service role, **no session**): `lib/services/render-worker.service.ts`
  (`claimNextQueuedRenderJob` atomic claim, `processRenderJobWithAdmin`,
  `processQueuedRenderJobsLoop`) + entry `workers/render-worker.ts`
  (`pnpm worker:render`, tsx). The worker creates the admin client **inline**
  (not via the `server-only` admin module) and is **never imported by the app**;
  every query is still scoped to the job's `project_id`+`user_id`. The shared
  render modules (`timeline`/`ffmpeg-renderer`/`environment`/`constants`) dropped
  their `server-only` guard so the worker (tsx) can reuse them — their `node:*`
  imports keep them out of the browser. Deploy the worker with FFmpeg
  (`Dockerfile.worker` / VPS / Fly / Railway); the web app only enqueues + polls
  and is serverless-safe. See `docs/17-render-worker-spec.md`.
- **Render diagnostics.** `lib/render/environment.ts`
  `detectRenderEnvironment()` / `isFfmpegAvailable()` / `getFfmpegDiagnostics()`
  verify FFmpeg (spawns `ffmpeg -version`) and classify the runtime
  (`local`/`vercel`/`node-server`). `GET /api/health/render` returns
  `{ ok, ffmpegAvailable, ffmpegPath?, environment, message, timestamp }` (no
  secrets). `renderProject` checks availability **before** creating any
  job/export rows and fails with a friendly message when FFmpeg is missing;
  `RenderProgressScreen` shows it with Retry. **Vercel/serverless is not suitable
  for FFmpeg rendering — a render worker is the next step.**
- Emotion colors come from a single source of truth: `lib/emotions.ts`
  (`getEmotionColor()` / `emotionColorMap`). Do not re-inline emotion hex values.
- A first **Supabase schema** exists at
  `supabase/migrations/001_initial_schema.sql` (tables, indexes, triggers, RLS,
  storage buckets). It is **schema only** — not executed automatically, and the
  **frontend is NOT connected to Supabase**. Apply it manually (SQL Editor /
  Supabase CLI); see `supabase/README.md`. `.env.example` lists the keys (no real
  secrets committed; `.env.local` is gitignored).
- A **Supabase client layer** exists at `lib/supabase/` (`@supabase/supabase-js`
  + `@supabase/ssr`): `createSupabaseBrowserClient()` (client),
  `createSupabaseServerClient()` (session-aware server), and
  `createSupabaseAdminClient()` (**server-only** service role — `import
  'server-only'`, NOT re-exported from the barrel, never imported by client
  code). Diagnostic route: `GET /api/health/supabase`. **Still mock-driven — no
  screen/provider reads from Supabase yet.** Never move the service role key into
  `NEXT_PUBLIC_*`; never import `lib/supabase/admin` in a client component.
- **Supabase Auth is implemented.** `middleware.ts` refreshes the session and
  protects `/app/*` (signed-out → `/login?next=…`; signed-in → away from
  `/login`/`/signup`). Public: `/`, `/login`, `/signup`, `/auth/callback`,
  `/api/health/supabase`. Auth UI in `components/auth/*`; pages `app/login`,
  `app/signup`; code exchange in `app/auth/callback/route.ts`; sign-out in
  Settings. Server helpers `getCurrentUser()`/`requireUser()` in
  `lib/supabase/auth.ts`.
- **Project persistence (first real data).** `lib/services/projects.service.ts`
  (server-only) does CRUD on the user's `projects` (`getCurrentUserProjects`,
  `getRecentProjects`, `getProjectById`, `createProject`, `archiveProject`,
  `deleteProject`). `lib/mappers/project.mapper.ts` maps DB rows → UI `Project`
  (never fabricates `views`). Server actions in `app/app/projects/actions.ts`.
  The `/app` and `/app/projects` pages are server components that fetch real
  data; `HomeDashboard`/`ProjectsScreen` accept an optional `projects` prop
  (mock fallback when omitted). Settings shows the real user. **The create flow
  is still mock-driven** — `projectId` is only carried in the URL
  (`?projectId=…`) for a future provider-hydration task.

## Current stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (tokens in `app/globals.css`)
- **Framer Motion**, **lucide-react**
- shadcn-style UI + **Base UI**
- Package manager: **pnpm** (a `pnpm-lock.yaml` is committed)

## Future architecture direction (DO NOT build without instruction)

The planned backend (see `docs/04-architecture-technique.md`):

- **Supabase** (Auth + Postgres + Storage)
- **OpenAI** (or equivalent) for the storytelling engine
- **Pexels / Pixabay** for stock-clip matching
- **Remotion + FFmpeg** for rendering/export

## What Claude must NOT modify without explicit instruction

- Do **not** implement authentication.
- Do **not** implement file upload or recording.
- Do **not** implement transcription.
- Do **not** add real API calls or connect Supabase / OpenAI / Pexels / Pixabay /
  Remotion / FFmpeg.
- Do **not** implement rendering.
- Do **not** redesign the UI or change the dark, premium, cinematic look.
- Do **not** remove the mock data — it is needed for UI development.
- Do **not** break the mobile-first experience.

When in doubt, ask before adding a dependency or a backend concern.

## Coding rules

- TypeScript everywhere; prefer shared types from `lib/types.ts` over re-declaring
  object shapes inline.
- Keep mock data **internally consistent**: a project's `scenes` count must match
  its storyboard length, and the featured "Midnight Betrayal" storyboard
  (8 scenes, `1:18`) is referenced across several screens — update all references
  together if you change it.
- Match the surrounding code style (Tailwind utility classes, inline style objects
  for dynamic colors/gradients, `cn()` for conditional classes).
- Preserve accessibility: `aria-label` on icon buttons, `role="list"/"listitem"`,
  `aria-pressed` / `aria-checked`, `aria-live` on progress.
- Keep components client-side where they already are (`'use client'`).

## Folder conventions

```
app/                      # Next.js App Router
  page.tsx                # public landing page (/)
  layout.tsx, globals.css
  app/                    # app section (auth-protected by middleware.ts)
    layout.tsx            # wraps all /app/* routes in VoxReelAppShell
    page.tsx              # /app          → server-fetch → DashboardConnected
    projects/page.tsx     # /app/projects → server-fetch → ProjectsConnected
    projects/actions.ts   # project server actions (create/archive/delete)
    settings/page.tsx     # /app/settings → SettingsConnected (real user)
    create/               # the create flow (upload → … → export)
      page.tsx            # /app/create   → redirects to /app/create/upload
      upload, style, analysis, transcript, storyboard,
      scene/[sceneId], preview, rendering, export
middleware.ts             # Supabase session refresh + /app/* auth gate
app/
  login/, signup/         # public auth pages
  auth/callback/          # OAuth / email-confirmation code exchange
components/
  app/                    # server-page → screen connectors (Dashboard/Projects/Settings)
  auth/                   # AuthCard, LoginForm, SignupForm, SignOutButton
  layout/                 # VoxReelAppShell (sidebar + bottom nav + main)
  providers/              # CreateFlowProvider (create-flow draft state)
  screens/                # full-screen views (one file may export several)
  voxreel/                # VoxReel-specific building blocks
  ui/                     # generic shadcn-style primitives
lib/
  routes.ts               # ROUTES constants + sceneRoute() helper
  emotions.ts             # emotion → color map (getEmotionColor) — single source
  types.ts                # shared UI types (incl. CreateFlowState)
  mock-data.ts            # mock content for the UI
  utils.ts                # cn() and helpers
  services/               # server-only data access (projects.service.ts)
  mappers/                # DB row → UI shape (project.mapper.ts)
  supabase/               # Supabase client layer (browser/server/admin/types)
docs/                     # product + technical specs (00–16)
supabase/                 # database schema (NOT connected to the app yet)
  migrations/             # SQL migrations, run manually (Editor / Supabase CLI)
  README.md               # how to apply the migration
public/                   # static assets
```

### Supabase client layer (`lib/supabase/`)

- `index.ts` exports the safe clients only: `createSupabaseBrowserClient`,
  `createSupabaseServerClient`. The **admin** client is NOT exported here.
- `admin.ts` is **server-only** (`import 'server-only'`). Import it directly and
  only from server code. It uses the service role key (bypasses RLS).
- `env.ts` validates env vars and throws clear errors (variable names only,
  never values). `database.types.ts` holds the typed `Database` schema.

### Create-flow state

- `useCreateFlow()` (from `components/providers/CreateFlowProvider`) exposes the
  shared draft + typed actions (`setStoryStyle`, `updateScene`, `addScene`,
  `lockScene`, `replaceSceneClip`, `resetCreateFlow`, …) plus `projectId` (the
  real Supabase id, or `null` in mock mode) and `hydrateDraft()`. Only usable
  **inside `/app/create/*`** (the provider does not wrap Home/Projects/Settings).
- The **full create-flow lifecycle is now connected** (still 100% mock):
  - AudioUpload → `setAudioMetadata` (mock file metadata) on continue.
  - StyleSelection → `storyStyle`, `language`, `visualSource`, `captionStyle`.
  - Analysis → simulates the pipeline, then populates `transcript` + `scenes`.
  - TranscriptReview → reads/edits `transcript`.
  - Storyboard → reads `scenes` (count/duration/add).
  - SceneDetailEditor → caption/motion/transition/clip/lock + missing-scene
    fallback.
  - Preview → reads title/scene count/duration.
  - Rendering → drives `renderStatus` (`rendering` → `complete`) and writes
    `export` metadata (fileName/duration/resolution/quality/size/format/createdAt).
  - Export → reads `export` metadata + project title, with safe fallbacks.

### Routing notes

- Each `app/app/**/page.tsx` is a thin client wrapper that renders an existing
  screen from `components/screens/` and supplies its `onNext` / `onBack` /
  `onCreateReel` callbacks via `useRouter()` — screens were not rewritten.
- The shared shell (`components/layout/VoxReelAppShell.tsx`) derives the active
  nav tab from `usePathname()` and navigates with the router.
- Use `ROUTES` from `lib/routes.ts` instead of hardcoding path strings.

## How to run the project

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## How to test / build

```bash
pnpm lint         # ESLint
pnpm build        # production build (type-checks the project)
pnpm start        # serve the production build
```

There is no unit-test suite yet; "testing" today means lint + build + manually
clicking through the flow in the browser.

## Next recommended tasks

See `docs/16-claude-code-tasks.md` for the maintained backlog. Highlights:

1. ~~Migrate to the App Router~~ ✅ done (routes under `app/app/*`, `lib/routes.ts`).
2. ~~Centralize the emotion → color map~~ ✅ done (`lib/emotions.ts`).
3. ~~Shared create-flow draft state~~ ✅ done (`CreateFlowProvider`).
4. Extract design tokens (colors/typography) into documented constants.
5. Connect the remaining create steps (upload/analysis/rendering/export) to the
   provider once their lifecycle is defined.

Keep `docs/16-claude-code-tasks.md` updated as work is completed.
