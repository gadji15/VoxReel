# 01 — Identité & Design System

> Status: **Drafted** from the current implemented UI. Values below reflect what
> is actually used in the codebase (`app/globals.css`, components, mock data).

## Brand personality

Dark, premium, cinematic, emotionally intense. The interface should feel like a
professional film/color-grading tool — restrained, high-contrast, and confident.

## Color palette

The UI is built around a near-black canvas with a single hot accent (red) and
supporting emotion colors.

| Token / usage        | Hex        | Notes                                   |
| -------------------- | ---------- | --------------------------------------- |
| Background (canvas)  | `#08090D`  | Deepest base                            |
| Surface / card       | `#0E0F14`  | Primary card background                 |
| Surface (raised)     | `#111318`  | Sheets, summary bars                    |
| Border               | `#1C2029` / `#252A33` | Hairline separators          |
| Foreground (text)    | `#F0EDE6` / `#F4F1EA` | Warm off-white               |
| Secondary text       | `#7A8394` / `#9CA3AF` | Muted labels                 |
| **Red accent**       | `#C43C3C` / `#D64545` | Primary CTA / brand          |
| Red accent (deep)    | `#B03030`  | Gradient pair for buttons               |
| Violet (emotion)     | `#7C5CFF` / `#6B4FE8` | Motion, "rendering" state    |
| Gold (success/pro)   | `#C9A45A` / `#D6B36A` | Published, success, ratings  |

### Emotion colors

Scenes carry an `emotionColor`. Current mapping in mock data:

- Dread → `#7C5CFF`
- Shock / Betrayal / Rage → `#D64545`
- Numbness → `#9CA3AF`
- Grief → `#5C7CFF`
- Resolve / Liberation → `#D6B36A`

> TODO: formalize the full emotion → color scale as a single source of truth
> (currently inlined in `lib/mock-data.ts`).

## Typography

- System / Geist-style sans (inherited from Next.js + Tailwind defaults).
- Heavy use of **bold**, tight tracking for headings; uppercase + wide tracking
  (`tracking-widest`) for eyebrow labels.
- `tabular-nums` for timecodes, counts, and stats.

## Spacing, radius & elevation

- Rounded corners are generous: `rounded-xl` (12px) for controls,
  `rounded-2xl` / `rounded-3xl` for cards and sheets, `rounded-[32px]`–`[40px]`
  for phone frames.
- Elevation is expressed with layered shadows + colored glows
  (e.g. `0 0 24px rgba(196,60,60,0.4)` on the record CTA).

## Signature visual motifs

- **9:16 phone frame** preview with vignette, film grain, and emotion-tinted
  gradient (`VideoPreviewPhoneFrame`).
- **Audio waveform** bars (`AudioWaveform`).
- **Cinematic gradient washes** per platform on project thumbnails.
- **Progress rings** for analysis and rendering.

## Components inventory (implemented)

- `voxreel/Logo`, `Badges` (Emotion / Intensity / MatchScore), `BottomSheet`,
  `DesktopSidebar`, `MobileBottomNav`, `ProjectCard`, `SceneCard`,
  `AudioWaveform`, `VideoPreviewPhoneFrame`.
- `ui/button` (shadcn-style).

## TODO

- [ ] Extract color tokens into a documented theme map (light reference only —
      the product is dark-only by design).
- [ ] Define typography scale tokens (sizes/weights) explicitly.
- [ ] Document motion timing/easing conventions used by Framer Motion.
- [ ] Add a logo usage / clear-space spec.
