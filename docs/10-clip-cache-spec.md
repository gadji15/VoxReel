# 10 — Clip Cache Spec

> Status: **Implemented (MVP).** Each scene's selected stock clip is downloaded
> server-side and cached in the private `video-clips-cache` bucket, ready for the
> future renderer. Rendering itself is not implemented.
>
> (The storyboard-editor notes live in `10-storyboard-editor-spec.md`.)

## How it works

1. After stock search selects clips, `cacheSelectedClipsForProjectAction(projectId)`
   runs (from the analysis screen, non-fatal).
2. `lib/services/clip-cache.service.ts` (server-only), per `selected_clips` row:
   - resolves the provider URL (`source_url`, else `metadata.sourceUrl` /
     `previewUrl`),
   - `fetch`es it server-side (30s timeout), validates status + content-type,
     enforces a **100 MB** cap (via `content-length` and the downloaded blob),
   - uploads to `video-clips-cache/{user_id}/{project_id}/{scene_id}/{selected_clip_id}.mp4`
     (`upsert: true`),
   - updates `selected_clips.storage_bucket` + `storage_path`. **`source_url` is
     left unchanged.**
3. Provider scenes hydrate with `clipCachedBucket` / `clipCachedPath`
   (`getCreateFlowDraft` + mappers) for the renderer; the UI still previews from
   the provider URL.

## Safety

- **Server-only**; provider keys are never exposed. RLS storage policy requires
  the first path segment to be `auth.uid()` (the path starts with `user_id`).
- Accepted content types: `video/mp4`, `video/quicktime`, `video/webm`, or
  `application/octet-stream`/none (provider didn't declare one). Other types are
  skipped.
- **One failing clip never aborts the project run**; results are returned
  per-clip with a status (`cached` / `no_source` / `too_large` / `failed`).
- **Idempotent**: the deterministic path + `upsert` overwrites; the
  `selected_clips` row is updated, not duplicated. Re-running analysis replaces
  candidates/selected clips, then re-caches.

## Not implemented / follow-ups

- [ ] Streaming download with a hard byte cap (currently buffers the blob).
- [ ] Concurrency / queueing for many scenes (currently sequential, inline).
- [ ] Transcode/normalize clips (resolution, fps, trim) for the renderer.
- [ ] The render pipeline that consumes the cached files (`render_jobs` /
      `exports`).
