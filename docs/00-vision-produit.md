# 00 — Vision Produit

> Status: **Drafted**. This document captures the product vision for VoxReel.

## One-liner

**VoxReel turns a spoken voice story into a cinematic vertical reel — ready for
TikTok, Instagram Reels, and YouTube Shorts — in minutes.**

## The problem

Short-form vertical video drives the most reach on social platforms today, but
producing it well is slow and skill-intensive. A creator with a great *story*
still has to:

- Write and structure a script.
- Source matching stock footage.
- Cut, time, and sequence scenes.
- Add motion, transitions, captions, and a consistent look.
- Export in the right format for each platform.

Most storytellers never ship because the production gap is too wide.

## The VoxReel promise

Speak the story. VoxReel handles the rest:

1. **Record / upload** a voice story.
2. VoxReel **transcribes** the audio.
3. A **storytelling engine** segments the narration into emotionally-arced scenes.
4. Each scene is **matched to cinematic stock footage**.
5. **Motion, transitions, and captions** are applied automatically.
6. The creator keeps **human control** — every scene is editable.
7. VoxReel **renders** a polished 9:16 reel and prepares it for export.

## Target audience

- Solo storytellers, faceless-channel creators, and narrative content makers.
- US / global English-first audience.
- Mobile-first creators who work primarily from a phone.

## Positioning & tone

- **Dark, premium, cinematic.** The product should feel like a film tool, not a
  meme generator.
- **Emotion-driven.** Scenes are organized around emotional beats (dread, shock,
  rage, resolve…), not just sentences.
- **Fast but controllable.** Automation gets you 90% there; the editor gets you
  the last 10%.

## Core differentiators

- Emotion-aware scene segmentation (the "storytelling engine").
- AI clip-matching with a confidence/match score per scene.
- A mobile-native editing experience (bottom sheets, swipeable storyboard).
- Cinematic motion + transition presets tuned for vertical video.

## North-star outcome

A creator can go from a raw voice note to a share-ready cinematic reel
(target runtime **60–90 seconds**) without leaving their phone.

## Out of scope (for now)

- Multi-user collaboration.
- Long-form (>3 min) video.
- Live recording effects / AR.
- Real backend, auth, and rendering — see the architecture docs for the planned
  direction. The current app is a **frontend-only UI skeleton**.

## TODO

- [ ] Validate the 60–90s target runtime with real creator feedback.
- [ ] Define pricing tiers and usage limits (mock UI references "Pro · $19/mo").
- [ ] Define success metrics (activation, reels published, retention).
