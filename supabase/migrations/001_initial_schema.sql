-- ============================================================================
-- VoxReel — initial database schema
-- Migration: 001_initial_schema.sql
--
-- Target: Supabase (PostgreSQL 15+).
--
-- This migration is written to be idempotent where reasonable:
--   * create extension if not exists
--   * create table if not exists
--   * create index if not exists
--   * drop policy / drop trigger if exists before (re)creating
--   * insert ... on conflict do nothing for seed-like rows (storage buckets)
-- It performs NO destructive operations (no drop table, no delete data).
--
-- IMPORTANT: This file is NOT executed automatically. Run it manually in the
-- Supabase SQL Editor or via the Supabase CLI (see README / docs/16).
-- The VoxReel frontend is NOT connected to Supabase yet.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Keep updated_at fresh on any UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles ------------------------------------------------------------------
-- One row per Supabase auth user. profiles.id IS the auth user id, and is used
-- as the `user_id` reference for all user-owned rows below.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  username    text unique,
  avatar_url  text,
  plan        text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- projects ------------------------------------------------------------------
-- The central reel/video project.
-- NOTE: export_id intentionally has no inline FK here to avoid a circular
-- dependency with the `exports` table; the FK is added via ALTER at the end.
create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null default 'Untitled Reel',
  description       text,
  status            text not null default 'draft',
  language          text not null default 'English',
  story_style       text,
  visual_source     text not null default 'stock',
  caption_style     text,
  duration_seconds  numeric(10, 2) not null default 0,
  total_scenes      integer not null default 0,
  thumbnail_path    text,
  export_id         uuid,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- audio_files ---------------------------------------------------------------
create table if not exists public.audio_files (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  file_name         text,
  storage_bucket    text not null default 'audio-files',
  storage_path      text,
  mime_type         text,
  size_bytes        bigint,
  duration_seconds  numeric(10, 2),
  status            text not null default 'pending',
  waveform_data     jsonb,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- transcript_segments -------------------------------------------------------
create table if not exists public.transcript_segments (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  segment_index       integer not null,
  start_time_seconds  numeric(10, 3) not null default 0,
  end_time_seconds    numeric(10, 3) not null default 0,
  text                text not null default '',
  original_text       text,
  confidence          numeric(5, 4),
  speaker             text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, segment_index)
);

-- scenes --------------------------------------------------------------------
create table if not exists public.scenes (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  scene_index         integer not null,
  start_time_seconds  numeric(10, 3) not null default 0,
  end_time_seconds    numeric(10, 3) not null default 0,
  title               text,
  text                text not null default '',
  emotion             text,
  emotion_color       text,
  intensity           integer not null default 50,
  visual_intent       text,
  search_query        text,
  motion_preset       text,
  transition_preset   text,
  locked              boolean not null default false,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, scene_index),
  constraint scenes_intensity_range check (intensity between 0 and 100),
  constraint scenes_time_order check (end_time_seconds > start_time_seconds)
);

-- captions ------------------------------------------------------------------
create table if not exists public.captions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  scene_id            uuid references public.scenes (id) on delete set null,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  caption_index       integer not null,
  start_time_seconds  numeric(10, 3) not null default 0,
  end_time_seconds    numeric(10, 3) not null default 0,
  text                text not null default '',
  style               text,
  position            text,
  highlight_words     jsonb,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, caption_index)
);

-- clip_candidates -----------------------------------------------------------
-- Stock-video candidates from Pexels / Pixabay / uploads / future AI sources.
create table if not exists public.clip_candidates (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  scene_id          uuid not null references public.scenes (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  provider          text,
  provider_clip_id  text,
  title             text,
  description       text,
  thumbnail_url     text,
  preview_url       text,
  download_url      text,
  duration_seconds  numeric(10, 2),
  width             integer,
  height            integer,
  orientation       text,
  match_score       integer,
  reason            text,
  license           text,
  author_name       text,
  author_url        text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  constraint clip_candidates_match_score_range check (match_score between 0 and 100)
);

-- selected_clips ------------------------------------------------------------
-- The single chosen clip per scene.
create table if not exists public.selected_clips (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  scene_id            uuid not null references public.scenes (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  clip_candidate_id   uuid references public.clip_candidates (id) on delete set null,
  provider            text,
  source_url          text,
  storage_bucket      text default 'video-clips-cache',
  storage_path        text,
  start_trim_seconds  numeric(10, 3) not null default 0,
  end_trim_seconds    numeric(10, 3),
  crop_mode           text,
  motion_preset       text,
  transition_preset   text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (scene_id)
);

-- render_jobs ---------------------------------------------------------------
create table if not exists public.render_jobs (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  status              text not null default 'queued',
  progress            integer not null default 0,
  current_step        text,
  render_preset       text,
  resolution_width    integer not null default 1080,
  resolution_height   integer not null default 1920,
  fps                 integer not null default 30,
  started_at          timestamptz,
  completed_at        timestamptz,
  failed_at           timestamptz,
  error_message       text,
  error_code          text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint render_jobs_progress_range check (progress between 0 and 100)
);

-- exports -------------------------------------------------------------------
create table if not exists public.exports (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects (id) on delete cascade,
  user_id            uuid not null references public.profiles (id) on delete cascade,
  render_job_id      uuid references public.render_jobs (id) on delete set null,
  file_name          text,
  storage_bucket     text not null default 'video-exports',
  storage_path       text,
  format             text not null default 'mp4',
  mime_type          text not null default 'video/mp4',
  duration_seconds   numeric(10, 2),
  size_bytes         bigint,
  resolution_width   integer not null default 1080,
  resolution_height  integer not null default 1920,
  fps                integer not null default 30,
  download_count     integer not null default 0,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- project_events ------------------------------------------------------------
create table if not exists public.project_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  event_type  text not null,
  message     text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- job_events ----------------------------------------------------------------
create table if not exists public.job_events (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.render_jobs (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  event_type  text not null,
  step        text,
  progress    integer,
  message     text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Deferred FK: projects.export_id -> exports.id (avoids circular dependency).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_export_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_export_id_fkey
      foreign key (export_id) references public.exports (id) on delete set null;
  end if;
end;
$$;

-- ============================================================================
-- Indexes
-- ============================================================================

create index if not exists idx_projects_user_id        on public.projects (user_id);
create index if not exists idx_projects_status         on public.projects (status);
create index if not exists idx_projects_created_at_desc on public.projects (created_at desc);

create index if not exists idx_audio_files_project_id  on public.audio_files (project_id);

create index if not exists idx_transcript_segments_project_id
  on public.transcript_segments (project_id);
create index if not exists idx_transcript_segments_project_segment
  on public.transcript_segments (project_id, segment_index);

create index if not exists idx_scenes_project_id       on public.scenes (project_id);
create index if not exists idx_scenes_project_scene
  on public.scenes (project_id, scene_index);

create index if not exists idx_captions_project_id     on public.captions (project_id);
create index if not exists idx_captions_scene_id       on public.captions (scene_id);

create index if not exists idx_clip_candidates_scene_id
  on public.clip_candidates (scene_id);
create index if not exists idx_clip_candidates_scene_match
  on public.clip_candidates (scene_id, match_score desc);

create index if not exists idx_selected_clips_project_id
  on public.selected_clips (project_id);
create index if not exists idx_selected_clips_scene_id
  on public.selected_clips (scene_id);

create index if not exists idx_render_jobs_project_id  on public.render_jobs (project_id);
create index if not exists idx_render_jobs_status      on public.render_jobs (status);

create index if not exists idx_exports_project_id      on public.exports (project_id);

-- Helpful secondary indexes for event history lookups.
create index if not exists idx_project_events_project_id on public.project_events (project_id);
create index if not exists idx_job_events_job_id         on public.job_events (job_id);

-- ============================================================================
-- updated_at triggers (one per table that has updated_at)
-- ============================================================================

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.audio_files;
create trigger set_updated_at before update on public.audio_files
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.transcript_segments;
create trigger set_updated_at before update on public.transcript_segments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.scenes;
create trigger set_updated_at before update on public.scenes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.captions;
create trigger set_updated_at before update on public.captions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.selected_clips;
create trigger set_updated_at before update on public.selected_clips
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.render_jobs;
create trigger set_updated_at before update on public.render_jobs
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.exports;
create trigger set_updated_at before update on public.exports
  for each row execute function public.set_updated_at();

-- Note: clip_candidates, project_events and job_events are append-only
-- (created_at only), so they have no updated_at trigger.

-- ============================================================================
-- New-user trigger (creates a profile for every new auth user)
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.audio_files         enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.scenes              enable row level security;
alter table public.captions            enable row level security;
alter table public.clip_candidates     enable row level security;
alter table public.selected_clips      enable row level security;
alter table public.render_jobs         enable row level security;
alter table public.exports             enable row level security;
alter table public.project_events      enable row level security;
alter table public.job_events          enable row level security;

-- ---- profiles (keyed by id = auth.uid()) ----------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- projects -------------------------------------------------------------
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- ---- audio_files ----------------------------------------------------------
drop policy if exists "audio_files_select_own" on public.audio_files;
create policy "audio_files_select_own" on public.audio_files
  for select using (auth.uid() = user_id);
drop policy if exists "audio_files_insert_own" on public.audio_files;
create policy "audio_files_insert_own" on public.audio_files
  for insert with check (auth.uid() = user_id);
drop policy if exists "audio_files_update_own" on public.audio_files;
create policy "audio_files_update_own" on public.audio_files
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "audio_files_delete_own" on public.audio_files;
create policy "audio_files_delete_own" on public.audio_files
  for delete using (auth.uid() = user_id);

-- ---- transcript_segments --------------------------------------------------
drop policy if exists "transcript_segments_select_own" on public.transcript_segments;
create policy "transcript_segments_select_own" on public.transcript_segments
  for select using (auth.uid() = user_id);
drop policy if exists "transcript_segments_insert_own" on public.transcript_segments;
create policy "transcript_segments_insert_own" on public.transcript_segments
  for insert with check (auth.uid() = user_id);
drop policy if exists "transcript_segments_update_own" on public.transcript_segments;
create policy "transcript_segments_update_own" on public.transcript_segments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "transcript_segments_delete_own" on public.transcript_segments;
create policy "transcript_segments_delete_own" on public.transcript_segments
  for delete using (auth.uid() = user_id);

-- ---- scenes ---------------------------------------------------------------
drop policy if exists "scenes_select_own" on public.scenes;
create policy "scenes_select_own" on public.scenes
  for select using (auth.uid() = user_id);
drop policy if exists "scenes_insert_own" on public.scenes;
create policy "scenes_insert_own" on public.scenes
  for insert with check (auth.uid() = user_id);
drop policy if exists "scenes_update_own" on public.scenes;
create policy "scenes_update_own" on public.scenes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "scenes_delete_own" on public.scenes;
create policy "scenes_delete_own" on public.scenes
  for delete using (auth.uid() = user_id);

-- ---- captions -------------------------------------------------------------
drop policy if exists "captions_select_own" on public.captions;
create policy "captions_select_own" on public.captions
  for select using (auth.uid() = user_id);
drop policy if exists "captions_insert_own" on public.captions;
create policy "captions_insert_own" on public.captions
  for insert with check (auth.uid() = user_id);
drop policy if exists "captions_update_own" on public.captions;
create policy "captions_update_own" on public.captions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "captions_delete_own" on public.captions;
create policy "captions_delete_own" on public.captions
  for delete using (auth.uid() = user_id);

-- ---- clip_candidates ------------------------------------------------------
drop policy if exists "clip_candidates_select_own" on public.clip_candidates;
create policy "clip_candidates_select_own" on public.clip_candidates
  for select using (auth.uid() = user_id);
drop policy if exists "clip_candidates_insert_own" on public.clip_candidates;
create policy "clip_candidates_insert_own" on public.clip_candidates
  for insert with check (auth.uid() = user_id);
drop policy if exists "clip_candidates_update_own" on public.clip_candidates;
create policy "clip_candidates_update_own" on public.clip_candidates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clip_candidates_delete_own" on public.clip_candidates;
create policy "clip_candidates_delete_own" on public.clip_candidates
  for delete using (auth.uid() = user_id);

-- ---- selected_clips -------------------------------------------------------
drop policy if exists "selected_clips_select_own" on public.selected_clips;
create policy "selected_clips_select_own" on public.selected_clips
  for select using (auth.uid() = user_id);
drop policy if exists "selected_clips_insert_own" on public.selected_clips;
create policy "selected_clips_insert_own" on public.selected_clips
  for insert with check (auth.uid() = user_id);
drop policy if exists "selected_clips_update_own" on public.selected_clips;
create policy "selected_clips_update_own" on public.selected_clips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "selected_clips_delete_own" on public.selected_clips;
create policy "selected_clips_delete_own" on public.selected_clips
  for delete using (auth.uid() = user_id);

-- ---- render_jobs ----------------------------------------------------------
drop policy if exists "render_jobs_select_own" on public.render_jobs;
create policy "render_jobs_select_own" on public.render_jobs
  for select using (auth.uid() = user_id);
drop policy if exists "render_jobs_insert_own" on public.render_jobs;
create policy "render_jobs_insert_own" on public.render_jobs
  for insert with check (auth.uid() = user_id);
drop policy if exists "render_jobs_update_own" on public.render_jobs;
create policy "render_jobs_update_own" on public.render_jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "render_jobs_delete_own" on public.render_jobs;
create policy "render_jobs_delete_own" on public.render_jobs
  for delete using (auth.uid() = user_id);

-- ---- exports --------------------------------------------------------------
drop policy if exists "exports_select_own" on public.exports;
create policy "exports_select_own" on public.exports
  for select using (auth.uid() = user_id);
drop policy if exists "exports_insert_own" on public.exports;
create policy "exports_insert_own" on public.exports
  for insert with check (auth.uid() = user_id);
drop policy if exists "exports_update_own" on public.exports;
create policy "exports_update_own" on public.exports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "exports_delete_own" on public.exports;
create policy "exports_delete_own" on public.exports
  for delete using (auth.uid() = user_id);

-- ---- project_events -------------------------------------------------------
drop policy if exists "project_events_select_own" on public.project_events;
create policy "project_events_select_own" on public.project_events
  for select using (auth.uid() = user_id);
drop policy if exists "project_events_insert_own" on public.project_events;
create policy "project_events_insert_own" on public.project_events
  for insert with check (auth.uid() = user_id);
drop policy if exists "project_events_update_own" on public.project_events;
create policy "project_events_update_own" on public.project_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "project_events_delete_own" on public.project_events;
create policy "project_events_delete_own" on public.project_events
  for delete using (auth.uid() = user_id);

-- ---- job_events -----------------------------------------------------------
drop policy if exists "job_events_select_own" on public.job_events;
create policy "job_events_select_own" on public.job_events
  for select using (auth.uid() = user_id);
drop policy if exists "job_events_insert_own" on public.job_events;
create policy "job_events_insert_own" on public.job_events
  for insert with check (auth.uid() = user_id);
drop policy if exists "job_events_update_own" on public.job_events;
create policy "job_events_update_own" on public.job_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "job_events_delete_own" on public.job_events;
create policy "job_events_delete_own" on public.job_events
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Storage buckets + policies
--
-- Buckets are private by default. Path convention puts the owning user_id as
-- the FIRST folder segment of the object name, so RLS can compare it against
-- auth.uid():
--   audio-files/{user_id}/{project_id}/original.m4a
--   video-exports/{user_id}/{project_id}/final.mp4
--   thumbnails/{user_id}/{project_id}/cover.jpg
--   video-clips-cache/{user_id}/{project_id}/{scene_id}/{clip_id}.mp4
--
-- NOTE: Creating policies on storage.objects requires elevated privileges and
-- is valid in the Supabase SQL Editor (run as the postgres/service role). If
-- your environment rejects these statements, comment them out and instead
-- configure bucket access from the Supabase Dashboard → Storage → Policies.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('audio-files',       'audio-files',       false),
  ('video-exports',     'video-exports',     false),
  ('thumbnails',        'thumbnails',        false),
  ('video-clips-cache', 'video-clips-cache', false)
on conflict (id) do nothing;

-- Read own files
drop policy if exists "storage_read_own" on storage.objects;
create policy "storage_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('audio-files', 'video-exports', 'thumbnails', 'video-clips-cache')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upload own files
drop policy if exists "storage_insert_own" on storage.objects;
create policy "storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('audio-files', 'video-exports', 'thumbnails', 'video-clips-cache')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update own files
drop policy if exists "storage_update_own" on storage.objects;
create policy "storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('audio-files', 'video-exports', 'thumbnails', 'video-clips-cache')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('audio-files', 'video-exports', 'thumbnails', 'video-clips-cache')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete own files
drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('audio-files', 'video-exports', 'thumbnails', 'video-clips-cache')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- End of migration 001_initial_schema.sql
-- ============================================================================
