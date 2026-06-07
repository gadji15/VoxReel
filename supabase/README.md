# VoxReel — Supabase

This folder holds the database schema for VoxReel. **Nothing here is connected to
the app yet** — the frontend is still fully mock-driven and does not read from
Supabase. The migration is **not executed automatically**; you run it manually.

## Contents

- `migrations/001_initial_schema.sql` — the initial schema: tables, indexes,
  `updated_at` triggers, a new-user → profile trigger, Row Level Security
  policies, and private storage buckets + policies.

The migration is written to be **idempotent** (re-running it is safe): it uses
`create ... if not exists`, `on conflict do nothing`, and
`drop policy/trigger if exists` before re-creating. It performs **no destructive
operations** (no `drop table`, no data deletion).

## How to run it

### Option A — Supabase SQL Editor (quickest)

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**.
3. Paste the entire contents of `migrations/001_initial_schema.sql`.
4. Click **Run**.

### Option B — Supabase CLI

```bash
# one-time
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# apply migrations in supabase/migrations
supabase db push
```

## After running

- A `profiles` row is auto-created for every new auth user (via the
  `on_auth_user_created` trigger).
- All user-owned tables have RLS enabled; users can only access their own rows
  (`auth.uid() = user_id`).
- Four private storage buckets exist: `audio-files`, `video-exports`,
  `thumbnails`, `video-clips-cache`. Object paths must start with the owner's
  `user_id` folder, e.g. `audio-files/{user_id}/{project_id}/original.m4a`.

## Environment variables

Copy `.env.example` (repo root) to `.env.local` and fill in your Supabase URL,
anon key, and service-role key when you begin wiring the backend. Do not commit
real secrets.
