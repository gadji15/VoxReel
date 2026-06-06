# 04 — Architecture Technique

> Status: **Placeholder + current-state notes.** Describes today's frontend-only
> architecture and the planned direction. **No backend exists yet.**

## Current state (implemented)

- **Framework:** Next.js 16 (App Router) + React 19.
- **Language:** TypeScript (strict).
- **Styling:** Tailwind CSS v4 + custom design tokens in `app/globals.css`.
- **Animation:** Framer Motion.
- **Icons:** lucide-react.
- **UI primitives:** shadcn-style components + Base UI.
- **State:** local React state. `app/page.tsx` is a single client component using
  a `view` state machine to switch screens (no router-based navigation yet).
- **Data:** static mock data in `lib/mock-data.ts`, typed via `lib/types.ts`.

There is **no API layer, database, authentication, file upload, transcription,
or rendering** in the codebase today.

## Planned direction (TODO — not implemented)

> The following is the intended future architecture. Do **not** build it without
> explicit instruction.

- **Auth & data:** Supabase (Postgres + Auth + Storage).
- **AI / LLM:** OpenAI (or equivalent) for the storytelling engine.
- **Stock video:** Pexels / Pixabay APIs for clip matching.
- **Rendering:** Remotion + FFmpeg for compositing and export.
- **Routing:** migrate the `view` state machine to App Router routes.

## Proposed module boundaries (future)

```
app/                # routes (replace single-page state machine)
lib/
  types.ts          # shared UI types (exists)
  mock-data.ts      # mock content (exists; replace with real fetchers)
  api/              # TODO: client-side data access
  server/           # TODO: server actions / route handlers
```

## TODO

- [ ] Decide router migration plan (state machine → App Router).
- [ ] Define environment variables and secrets management.
- [ ] Define the API contract for each pipeline stage.
- [ ] Decide sync vs. async (job queue) model for transcription + rendering.
