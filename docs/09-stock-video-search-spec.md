# 09 — Stock Video Search Spec

> Status: **Placeholder.** Clip matching is **mocked** (`scene.clip`,
> `scene.clipMatch`, and the suggested-clips list in the scene editor). No real
> provider integration exists.

## Scope

Given a scene's `visualIntent`, find and rank candidate vertical stock clips,
exposing a match score the UI already renders.

## Providers (planned)

- Pexels API, Pixabay API (free, vertical-friendly).

## Behavior (draft)

- Build a search query from `visualIntent` + emotion + style preset.
- Prefer 9:16 / vertical, dark/cinematic footage.
- Return ranked candidates with a 0–100 `clipMatch` confidence.
- Cache results; allow manual replacement (the "Replace Clip" sheet exists).

## Data shape

Scene fields involved (`lib/types.ts`): `clip`, `clipMatch`. A future
`ClipCandidate` type will carry provider id, thumbnail, duration, and URL.

## TODO

- [ ] Define query-construction strategy from `visualIntent`.
- [ ] Define ranking / match-score algorithm.
- [ ] Define caching + attribution/licensing handling.
- [ ] Wire the "Replace Clip" sheet to live results (later).
