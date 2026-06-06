# 02 — Mobile UX

> Status: **Drafted** from the current implemented flow. VoxReel is
> **mobile-first**; the desktop layout is an adaptation, not the other way around.

## Principles

1. **Thumb-first.** Primary actions live within easy reach; the bottom nav and
   bottom sheets keep interaction in the lower half of the screen.
2. **One decision per screen.** The create flow is a linear, low-friction wizard.
3. **Cinematic at rest.** Even idle screens feel like a film tool (dark canvas,
   glows, grain).
4. **Editable, not locked.** Automation proposes; the user disposes — every scene
   is one tap from an editor.

## Navigation model

- **Mobile:** `MobileBottomNav` (Home / Projects / Create / Settings).
- **Desktop:** `DesktopSidebar` (collapses the bottom nav, `lg:ml-56` content
  offset).
- The whole app is currently a single client component (`app/page.tsx`) using a
  `view` state machine rather than the Next.js router (see
  `docs/04-architecture-technique.md`).

## Screen map (implemented)

1. **Landing** → entry / "Get started".
2. **Home dashboard** → record CTA, stats, recent projects, trending styles.
3. **Projects** → searchable/filterable library, list/grid toggle.
4. **Create · Upload** → choose/record audio (UI only).
5. **Create · Style** → pick a cinematic style preset.
6. **Analysis** → animated progress ring + step list.
7. **Transcript review** → editable transcript lines.
8. **Storyboard** → swipeable list of `SceneCard`s + summary bar.
9. **Scene editor** → replace clip / edit caption / motion via bottom sheets.
10. **Preview** → full 9:16 player, platform selector.
11. **Rendering** → animated render progress.
12. **Export success** → file info + share targets.
13. **Settings** → account, subscription, preferences.

## Key interaction patterns

- **Bottom sheets** (`BottomSheet`) for focused edits (clip, caption, motion).
  Heights: `tall` for editors.
- **Swipeable / scrollable storyboard** of scenes.
- **Inline editing** for transcript lines (tap-to-edit `textarea`).
- **Active scene state** persists between storyboard and scene editor.

## Layout & responsiveness

- Content is constrained to `max-w-xl` and centered for readability on large
  screens while staying mobile-native.
- Generous bottom padding (`pb-24`/`pb-28`) reserves space for the mobile nav.
- Safe, high-contrast tap targets (min ~36–44px).

## Accessibility (already in place, keep it)

- `aria-label`s on icon buttons, `role="list"/"listitem"` on collections,
  `aria-pressed` / `aria-checked` on toggles, `aria-live` on progress counters.

> Keep accessibility parity when adding new screens or controls.

## TODO

- [ ] Define real gesture support (swipe between scenes, pull-to-refresh).
- [ ] Specify haptics for key transitions.
- [ ] Define empty/error/loading states once data is real.
- [ ] Audit color contrast against WCAG AA for secondary text on dark surfaces.
