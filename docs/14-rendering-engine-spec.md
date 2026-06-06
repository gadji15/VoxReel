# 14 — Rendering Engine Spec

> Status: **Placeholder.** Rendering is **simulated** (`RenderProgressScreen`
> animation, mock export file). No real compositing/encoding exists.

## Scope

Composite scenes (clips + motion + transitions + captions + audio) into a final
9:16 video and export it for TikTok / Reels / Shorts.

## Planned stack

- **Remotion** for declarative React-based compositing.
- **FFmpeg** for encoding / muxing the narration audio.

## Pipeline (draft)

1. Resolve assets (matched clips, audio).
2. Build the Remotion composition from the storyboard + presets.
3. Apply captions and color/style grade.
4. Encode to 4K 9:16, mux audio, output mp4.
5. Store the artifact + expose download/share.

## Current UI references

- Render stages: compositing, motion, color grade, captions, encoding, finalize.
- Export card: `3840 × 2160 · 4K · 1:18 · 28.6 MB` (mock values).

## TODO

- [ ] Decide render location (server / serverless / Remotion Lambda).
- [ ] Define the storyboard → composition mapping.
- [ ] Define output presets per platform.
- [ ] Define job tracking (`render_jobs`, doc 05) and progress reporting.
