# 07 — Transcription Spec

> Status: **Placeholder.** Transcription is **mocked** today
> (`mockTranscript` + animated `AnalysisProgressScreen`). No real STT exists.

## Scope

Convert uploaded audio into a timestamped, editable transcript that feeds the
storytelling engine.

## Requirements (draft)

- Word- or line-level timestamps (UI shows `m:ss` per line).
- Editable lines in the UI (already implemented against mock data).
- Confidence/accuracy indicator (UI shows "98% accurate").
- English-first; consider multilingual later.

## Provider options

> TODO: evaluate (OpenAI Whisper / hosted STT / Supabase edge function, etc.).

## Data shape

See `TranscriptLine` in `lib/types.ts`:

```ts
interface TranscriptLine { id: number; start: string; text: string }
```

## TODO

- [ ] Choose STT provider and pricing model.
- [ ] Define timestamp granularity (word vs. line).
- [ ] Define how edits propagate to scene segmentation.
- [ ] Replace `mockTranscript` with real results (later).
