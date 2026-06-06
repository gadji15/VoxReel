# 13 — Transition & Motion Engine Spec

> Status: **Placeholder.** Motion and transition presets are **mocked**
> (`mockMotionPresets`, `mockTransitionPresets`). No render-time motion exists.

## Scope

Define camera-motion (per scene) and transitions (between scenes) as named
presets that the UI selects and the renderer applies.

## Current presets (UI)

- **Motion:** Slow Push-In, Pull Back Wide, Zoom Out Fast, Shake + Zoom,
  Static Hold, Gentle Drift.
- **Transition:** Hard Cut, Cross Dissolve, Fade to Black, Glitch Cut, Whip Pan,
  Match Cut.
- Transition duration slider exists in the UI.

## Requirements (draft)

- Each preset maps to concrete render parameters (keyframes, easing, duration).
- Motion respects the source clip's framing; transitions respect pacing.
- Presets should feel cinematic and tuned for 9:16.

## Data shape

See `MotionPreset` and `TransitionPreset` in `lib/types.ts`.

## TODO

- [ ] Define the math/keyframes for each preset.
- [ ] Define default per-emotion motion/transition suggestions.
- [ ] Map presets to Remotion components (doc 14).
