# 12 — Caption Engine Spec

> Status: **Placeholder.** Captions are **mocked** (`mockCaptions`, caption
> editor sheet). No real caption generation/styling pipeline exists.

## Scope

Generate, time, and style on-screen captions that match the cinematic look and
stay legible on vertical video.

## Current UI (implemented)

- Caption editor sheet: text, style preset, font size, color.
- Style presets referenced: `bold-center`, `italic-bottom`, `impact-top`,
  `outline-left`.

## Requirements (draft)

- Derive captions from transcript/scene text with timing.
- Style presets map to render-time typography (font, weight, position, stroke).
- Keep within safe areas for TikTok/Reels/Shorts UI overlays.

## Data shape

See `Caption` in `lib/types.ts`: `{ id, text, start, style }`.

## TODO

- [ ] Define the full preset catalog and their render parameters.
- [ ] Define auto-timing (per word vs. per line).
- [ ] Define safe-area constraints per platform.
- [ ] Connect to the rendering engine (doc 14).
