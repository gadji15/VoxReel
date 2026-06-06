# VoxReel

**Turn voice stories into cinematic vertical reels.**

VoxReel is a mobile-first, dark, premium SaaS web app that transforms a spoken
voice story into a cinematic vertical reel for **TikTok**, **Instagram Reels**,
and **YouTube Shorts**. Speak your story — VoxReel transcribes it, breaks it into
emotionally-arced scenes, matches each scene to cinematic stock footage, applies
motion, transitions, and captions, and renders a share-ready 9:16 reel, while
keeping you in control of every scene.

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
