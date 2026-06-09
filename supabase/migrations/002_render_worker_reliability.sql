-- ============================================================================
-- VoxReel — render worker reliability
-- Migration: 002_render_worker_reliability.sql
--
-- Adds Postgres-based job-queue hardening to `render_jobs`:
--   * attempt tracking + retry scheduling columns
--   * locking columns (claimed-by / heartbeat) for multi-worker safety
--   * an atomic claim function using FOR UPDATE SKIP LOCKED
--   * a stale-job requeue/fail function
--
-- Idempotent + non-destructive: ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT
-- EXISTS, CREATE OR REPLACE FUNCTION. No table is dropped, no data deleted.
--
-- Run this AFTER 001_initial_schema.sql (SQL Editor or `supabase db push`).
-- ============================================================================

-- ── Reliability columns ─────────────────────────────────────────────────────
alter table if exists public.render_jobs
  add column if not exists attempts            integer not null default 0,
  add column if not exists max_attempts        integer not null default 3,
  add column if not exists locked_at           timestamptz,
  add column if not exists locked_by           text,
  add column if not exists next_retry_at        timestamptz,
  add column if not exists worker_started_at   timestamptz,
  add column if not exists last_heartbeat_at   timestamptz;

-- ── Indexes for the queue / reaper queries ─────────────────────────────────
create index if not exists idx_render_jobs_status_next_retry
  on public.render_jobs (status, next_retry_at);
create index if not exists idx_render_jobs_status_locked
  on public.render_jobs (status, locked_at);
create index if not exists idx_render_jobs_locked_by
  on public.render_jobs (locked_by);

-- ============================================================================
-- Atomic claim: grab one queued job with row-level locking so two workers can
-- never claim the same job. Increments `attempts` at claim time (the safe,
-- atomic place). Returns the claimed row, or no rows when the queue is empty.
-- ============================================================================
create or replace function public.claim_next_render_job(worker_id text)
returns setof public.render_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  -- Pick the oldest eligible queued job and lock it; SKIP LOCKED lets other
  -- workers move on to the next row instead of blocking.
  select id
    into claimed_id
  from public.render_jobs
  where status = 'queued'
    and (next_retry_at is null or next_retry_at <= now())
  order by created_at asc
  for update skip locked
  limit 1;

  if claimed_id is null then
    return; -- no eligible job
  end if;

  return query
  update public.render_jobs
  set status            = 'processing',
      progress          = 1,
      current_step      = 'Claimed by render worker',
      attempts          = attempts + 1,
      locked_at         = now(),
      locked_by         = worker_id,
      worker_started_at = coalesce(worker_started_at, now()),
      last_heartbeat_at = now(),
      started_at        = coalesce(started_at, now()),
      next_retry_at     = null,
      updated_at        = now()
  where id = claimed_id
  returning *;
end;
$$;

-- ============================================================================
-- Stale reaper: jobs stuck in `processing` past the timeout (dead worker) are
-- either requeued (attempts left) or failed (attempts exhausted). Returns the
-- number of affected rows.
-- ============================================================================
create or replace function public.requeue_stale_render_jobs(stale_after_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff       timestamptz := now() - make_interval(secs => stale_after_seconds);
  retry_count  integer := 0;
  fail_count   integer := 0;
begin
  -- Requeue stale jobs that still have attempts remaining.
  with requeued as (
    update public.render_jobs
    set status        = 'queued',
        progress      = 0,
        current_step  = 'Requeued after stale worker',
        locked_at     = null,
        locked_by     = null,
        next_retry_at = now() + interval '30 seconds',
        updated_at    = now()
    where status = 'processing'
      and coalesce(last_heartbeat_at, locked_at, started_at, created_at) < cutoff
      and attempts < max_attempts
    returning 1
  )
  select count(*) into retry_count from requeued;

  -- Fail stale jobs that have exhausted their attempts.
  with failed as (
    update public.render_jobs
    set status        = 'failed',
        current_step  = 'Failed',
        error_message = 'Render job failed after maximum attempts',
        failed_at     = now(),
        locked_at     = null,
        locked_by     = null,
        updated_at    = now()
    where status = 'processing'
      and coalesce(last_heartbeat_at, locked_at, started_at, created_at) < cutoff
      and attempts >= max_attempts
    returning 1
  )
  select count(*) into fail_count from failed;

  return retry_count + fail_count;
end;
$$;

-- ============================================================================
-- Privileges: only the WORKER (service role) may run these functions. Revoke
-- the default PUBLIC execute so signed-in users can't claim/requeue jobs.
-- ============================================================================
revoke all on function public.claim_next_render_job(text) from public;
revoke all on function public.requeue_stale_render_jobs(integer) from public;
grant execute on function public.claim_next_render_job(text) to service_role;
grant execute on function public.requeue_stale_render_jobs(integer) to service_role;

-- ============================================================================
-- End of migration 002_render_worker_reliability.sql
-- ============================================================================
