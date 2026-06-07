# 05 — Database Schema

> Status: **Initial migration written.** The first canonical schema now lives in
> `supabase/migrations/001_initial_schema.sql`. It is **not executed
> automatically** and the **frontend is not connected to Supabase yet**. The UI
> types in `lib/types.ts` remain the frontend draft shapes, not the DB source of
> truth.

## Implemented tables (migration 001)

`profiles`, `projects`, `audio_files`, `transcript_segments`, `scenes`,
`captions`, `clip_candidates`, `selected_clips`, `render_jobs`, `exports`,
`project_events`, `job_events` — with uuid PKs (`gen_random_uuid()`), indexes,
`updated_at` triggers, a new-user → `profiles` trigger, Row Level Security
(`auth.uid() = user_id`), and private storage buckets (`audio-files`,
`video-exports`, `thumbnails`, `video-clips-cache`).

See `supabase/README.md` for how to apply it.

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
