# 08 — Storytelling Engine Spec

> Status: **Implemented (MVP).** Real LLM story analysis splits the persisted
> transcript into scenes via OpenAI structured output (server-only). Scenes are
> saved to the `scenes` table and drive the storyboard. Stock-clip matching and
> rendering are still not implemented.

## How it works

1. After transcription, `analyzeProjectStoryAction(projectId)` runs.
2. `lib/services/story-analysis.service.ts` (server-only) loads the project +
   ordered `transcript_segments`, builds prompts
   (`lib/story-analysis/prompt.ts`), and calls OpenAI
   (`gpt-4o-mini`, Chat Completions, `response_format: json_schema` strict) to
   return `{ summary, language, overall_emotion, scenes[] }`.
3. The result is **normalized/validated**: scenes sorted + reindexed from 1,
   `end > start` enforced, intensity clamped 0–100, hex color validated (else
   `getEmotionColor`), motion/transition keys mapped to UI preset names, empty
   text/title backfilled, `search_query` ensured.
4. Scenes are **REPLACED** (delete-then-insert) only after valid scenes exist;
   `projects.status → storyboard_ready`, `total_scenes`/`duration_seconds`
   updated. Provider scenes are returned for the storyboard.

## Inputs / outputs

- **Input:** timestamped `transcript_segments`, style context (`story_style`,
  `language`, `visual_source`, `caption_style`), duration.
- **Output:** `Scene[]` (`lib/types.ts`) + DB `scenes` rows incl. `search_query`
  (kept for the future stock-video step).

## Guardrails

- Scene count scales with duration (≈3–5 / 5–8 / 8–12 / 10–15 for
  15–30 / 30–60 / 60–120 / 120–180s).
- Model is instructed NOT to invent events, to use real timestamps, and to write
  cinematic, faceless-friendly `visual_intent` + concrete `search_query`.

## Not implemented / follow-ups

- [ ] Use `search_query` to fetch stock-clip candidates (doc 09).
- [ ] Word-level pacing / smarter scene boundaries.
- [ ] Full caption engine (captions still mock; `caption_hint` is stored).
- [ ] Cost/latency controls (currently a single inline call).
