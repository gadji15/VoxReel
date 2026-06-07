# 06 — Audio Upload Spec

> Status: **Implemented (upload).** Real file **upload** to Supabase Storage +
> `audio_files` metadata is live. **Recording** is still mock, and
> **transcription** is not implemented yet.

## Implemented

- **Upload (browser → Storage):** `lib/upload/audio-upload.ts` validates the
  file, reads its duration, and uploads via the **anon browser client** to the
  private bucket `audio-files` at `{user_id}/{project_id}/original.{ext}`
  (`upsert: true`). The storage RLS policy (migration 001) requires the first
  path segment to be `auth.uid()`.
- **Metadata (server):** `lib/services/audio.service.ts` (server-only) +
  `app/app/create/audio/actions.ts` upsert the `audio_files` row (REPLACE
  strategy — one per project) and set `projects.status = 'audio_uploaded'`
  (+ `duration_seconds` when known).
- **Provider:** `AudioUploadScreen` calls `setAudioMetadata` with the real
  metadata, then continues to `/app/create/style?projectId=…`. Hydration:
  `getCreateFlowDraft` now includes the `audio_files` row.
- **Validation:** mime ∈ {mpeg, mp3, mp4, m4a, x-m4a, wav, webm, ogg};
  ext ∈ {mp3, m4a, wav, webm, ogg, mp4}; max **50 MB**; duration **5–180s**
  (unknown duration is allowed and stored as `null`).

## Mock fallback (unchanged)

With **no** `projectId` (dev mode) the screen keeps the previous mock behavior.
**Recording** mode is still mock (no MediaRecorder upload yet).

## Not implemented / follow-ups

- [ ] Real in-app recording (MediaRecorder → upload).
- [ ] Storage object cleanup on project/audio delete (DB row is removed today).
- [ ] Upload progress percentage (currently a spinner/disabled state).
- [ ] **Transcription** of the uploaded file (next milestone) — replaces the
      mock transcript seeded at analysis.
