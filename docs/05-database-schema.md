# 05 — Database Schema

> Status: **Placeholder.** No database exists yet. This will define the canonical
> Supabase/Postgres schema. The UI types in `lib/types.ts` are a starting point,
> not the source of truth.

## Goals

Model users, projects, scenes, transcripts, captions, motions, transitions, and
render artifacts so the frontend can be backed by real data.

## Candidate entities (draft)

- `users` — account, plan, usage counters.
- `projects` — id, owner, title, status, platform, duration, scene_count, timestamps.
- `scenes` — project_id, index, time_start, time_end, emotion, intensity,
  text, visual_intent, clip_ref, clip_match, motion, transition.
- `transcripts` / `transcript_lines` — project_id, start, text.
- `captions` — scene_id, text, start, style.
- `assets` — uploaded audio, matched clips, rendered output (Supabase Storage refs).
- `render_jobs` — project_id, status, progress, output_asset, timestamps.

## Open questions

> TODO: resolve before implementation.

- One-to-many vs. embedded JSON for scenes/captions?
- How are stock clips referenced (provider + external id vs. cached asset)?
- Soft delete / versioning of storyboards?

## TODO

- [ ] Draw the ER diagram.
- [ ] Write SQL migrations.
- [ ] Define RLS (row-level security) policies for Supabase.
- [ ] Reconcile with `lib/types.ts`.
