# 11 — Human Control Editor Spec

> Status: **Placeholder + current-state notes.** The per-scene editor exists
> (`SceneDetailEditor`) with mock interactions only.

## Principle

Automation proposes; the human controls. Every AI decision (clip, caption,
motion, transition) must be reviewable and overridable per scene.

## Current UI (implemented)

- Scene preview (phone frame), emotion badge, intensity bar.
- Three tools via bottom sheets: **Replace Clip**, **Edit Caption**, **Motion**.
- Selected motion/transition state held locally.

## Requirements (draft)

- Persist per-scene overrides back to the storyboard/project.
- Make clip search live (doc 09) and caption/motion changes durable.
- Reflect overrides in the preview and final render.

## TODO

- [ ] Define the override data model and persistence.
- [ ] Define conflict rules when re-running AI after manual edits.
- [ ] Define per-scene preview that reflects current selections.
- [ ] Wire sheets to real data (later).
