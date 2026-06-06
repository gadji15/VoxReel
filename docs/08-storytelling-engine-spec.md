# 08 — Storytelling Engine Spec

> Status: **Placeholder.** This is VoxReel's core differentiator. Currently the
> output is **mocked** as `mockScenes`. No LLM/segmentation logic exists.

## Scope

Transform a transcript into an emotionally-arced storyboard: segment narration
into scenes, label each with an emotion + intensity, and describe the intended
visual.

## Inputs / outputs

- **Input:** timestamped transcript (`TranscriptLine[]`), chosen style preset.
- **Output:** `Scene[]` (see `lib/types.ts`) — index, time range, emotion,
  emotionColor, intensity, text, visualIntent, suggested motion/transition.

## Behavior (draft)

- Segment by emotional beat, not just sentence boundaries.
- Target 60–90s total runtime; ~8–10s per scene.
- Assign a dominant emotion + 0–100 intensity per scene.
- Produce a director-style `visualIntent` string used by clip search (doc 09).

## Emotion model

> TODO: define the canonical emotion set and emotion→color mapping (currently
> inlined in mock data / `docs/01`).

## TODO

- [ ] Define the LLM prompt + schema for scene generation.
- [ ] Define guardrails (scene count, runtime budget, pacing).
- [ ] Define how style presets bias tone/visuals.
- [ ] Replace `mockScenes` with generated output (later).
