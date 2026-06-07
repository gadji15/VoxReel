# 16 — Claude Code Tasks

> Status: **Working log.** Backlog of well-scoped tasks for Claude Code, plus a
> record of what has been done. Read `CLAUDE.md` before starting any task.

## Ground rules

- Do **not** implement auth, file upload, transcription, real API calls, or
  rendering without explicit instruction.
- Preserve the dark, premium, cinematic, mobile-first design.
- Keep the UI working and the build green.

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

## Next recommended tasks

- [ ] Auth: add a session middleware + minimal sign-in, and protect `/app/*`.
- [ ] Project persistence: back `CreateFlowProvider` actions with Supabase
      reads/writes (behind the same interface) once auth exists.
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
