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

## Next recommended tasks

- [ ] Real transcription: kick off a transcription job from the uploaded
      `audio_files` object and persist `transcript_segments` (replaces the mock
      transcript seeded at analysis).
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
