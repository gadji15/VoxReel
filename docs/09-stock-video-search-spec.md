# 09 — Stock Video Search Spec

> Status: **Implemented (MVP).** Real stock-video search via Pexels/Pixabay
> (server-only) runs after story analysis: candidates are saved to
> `clip_candidates`, the best is chosen into `selected_clips`, and the
> storyboard/scene editor show real clips. Downloading/caching + rendering are
> still not implemented.

## How it works

1. After scene splitting, `searchStockVideosForProjectAction(projectId)` runs.
2. `lib/services/stock-video.service.ts` (server-only) loads scenes and, per
   scene, queries available providers using `scene.search_query`
   (`lib/stock-video/pexels.ts`, `pixabay.ts` — server-only, key from env).
3. Results are normalized to `StockVideoCandidate` and scored 0–100
   (`lib/stock-video/scoring.ts`: orientation/duration/resolution fit; relevance
   is approximate and the `reason` says so).
4. Per scene: **REPLACE** `clip_candidates` (top ~8), then write the best into
   `selected_clips` (one per scene). `projects.status → clips_ready` when ≥1
   clip is selected.
5. Provider scenes are hydrated with the selected clip (title + `clipMatch` +
   thumbnail/preview/source URLs) via `getCreateFlowDraft`/mappers, so the
   storyboard and the **Replace Clip** sheet show real data. Selecting another
   candidate persists via `selectClipCandidateAction`.

## Providers

- **Pexels** (`orientation=portrait`) and **Pixabay** (`video_type=film`).
- If only one key is set, that provider is used. If **neither** is set, search is
  skipped with a friendly warning and scenes stay usable.

## Safety

- `PEXELS_API_KEY` / `PIXABAY_API_KEY` are **server-only**, never `NEXT_PUBLIC`,
  never sent to the browser, never logged. No service-role usage.

## Not implemented / follow-ups

- [ ] Download/cache clips to the `video-clips-cache` bucket.
- [ ] Semantic relevance (embeddings) instead of technical-fit scoring.
- [ ] Per-scene re-search button in the editor (`searchStockVideosForSceneAction`
      exists) and attribution display.
- [ ] Rendering using the selected clips.
