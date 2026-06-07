# 07 — Transcription Spec

> Status: **Implemented (MVP).** Real transcription via **OpenAI Whisper**
> (`whisper-1`, `verbose_json`, segment timestamps) runs server-side over the
> uploaded audio. Story analysis / scene-splitting is still **mock**.

## How it works

1. The user uploads audio (task 06) → `audio_files` row + Storage object.
2. On the analysis screen, for a real project with uploaded audio,
   `transcribeProjectAudioAction(projectId)` runs:
   - `lib/services/transcription.service.ts` (server-only) downloads the file
     from the `audio-files` bucket via the session Supabase client (RLS),
   - sends it to OpenAI (`lib/openai/client.ts`, server-only, `OPENAI_API_KEY`)
     with `model: whisper-1`, `response_format: verbose_json`,
     `timestamp_granularities: ['segment']`,
   - **REPLACEs** `transcript_segments` (delete-then-insert; no duplicates on
     re-run), then sets `projects.status = 'transcribed'`.
3. The real transcript is returned to `CreateFlowProvider` (`setTranscript`) and
   shown on the transcript screen. Hydration (`getCreateFlowDraft`) loads saved
   `transcript_segments` so refresh/return keeps the real transcript.

Statuses: `audio_uploaded` → `transcribing` → `transcribed` (or `failed`).

## Safety

- OpenAI is **server-only** — never called from the browser; the API key is not
  a `NEXT_PUBLIC_*` var and is never returned/logged with its value.
- Audio download + DB writes use the **session** Supabase client (RLS), never the
  service role.

## Data shape

`TranscriptLine` (`lib/types.ts`): `{ id: number; start: string; text: string }`.
DB `transcript_segments` store real `start_time_seconds` / `end_time_seconds`.

## Not implemented / follow-ups

- [ ] Word-level timestamps (currently segment-level).
- [ ] Confidence surfacing (Whisper segment logprobs → a score).
- [ ] Language selection passed to Whisper (currently auto-detect).
- [ ] Background/queued transcription for long files (currently inline await).
- [ ] **Real story analysis**: emotion detection + scene splitting from the real
      transcript (scenes are still seeded from mock).
