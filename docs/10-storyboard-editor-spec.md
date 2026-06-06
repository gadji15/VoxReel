# 10 — Storyboard Editor Spec

> Status: **Placeholder + current-state notes.** The storyboard UI exists
> (`StoryboardScreen`); it renders `mockScenes` and is not yet backed by data.

## Scope

The storyboard is the overview of all scenes in a reel — reorder, add, remove,
and open scenes for detailed editing.

## Current UI (implemented)

- Summary bar: scene count, duration, style.
- Scrollable list of `SceneCard`s with active-scene selection.
- "Add Scene" affordance (visual only).
- Tap a scene → Scene Editor (doc 11).

## Requirements (draft)

- Persist scene order and edits.
- Add / duplicate / delete scenes; recompute `index`, `total`, and timecodes.
- Keep the project `scenes` count and total duration in sync (today this
  consistency is maintained by hand in `lib/mock-data.ts`).

## TODO

- [ ] Define reordering interaction (drag / move).
- [ ] Define timecode recomputation when scenes change.
- [ ] Define autosave + undo.
- [ ] Back the screen with real project data (later).
