/**
 * VoxReel — emotion color system (single source of truth)
 *
 * Centralizes the emotion → color mapping that was previously inlined in
 * `lib/mock-data.ts` and scattered across components. Use `getEmotionColor()`
 * so every surface (scene cards, badges, previews) stays visually consistent.
 *
 * Colors are tuned for the dark, premium, cinematic VoxReel look.
 */

/** Canonical emotion → hex color map. */
export const emotionColorMap: Record<string, string> = {
  Dread: '#7C5CFF',
  Shock: '#D64545',
  Numbness: '#9CA3AF',
  Betrayal: '#D64545',
  Rage: '#D64545',
  Grief: '#5C7CFF',
  Resolve: '#D6B36A',
  Liberation: '#D6B36A',
  // A few additional common beats for future scenes:
  Hope: '#D6B36A',
  Fear: '#7C5CFF',
  Calm: '#5C7CFF',
  Joy: '#D6B36A',
}

/** Neutral fallback used when an emotion has no explicit color. */
export const DEFAULT_EMOTION_COLOR = '#9CA3AF'

/**
 * Resolve the hex color for an emotion label. Case-insensitive; falls back to a
 * neutral grey so the UI never renders an empty/undefined color.
 */
export function getEmotionColor(emotion: string | null | undefined): string {
  if (!emotion) return DEFAULT_EMOTION_COLOR
  if (emotionColorMap[emotion]) return emotionColorMap[emotion]
  // Case-insensitive lookup as a convenience.
  const match = Object.keys(emotionColorMap).find(
    (key) => key.toLowerCase() === emotion.toLowerCase()
  )
  return match ? emotionColorMap[match] : DEFAULT_EMOTION_COLOR
}

/** Intensity (0–100) bucket labels, ordered from lowest threshold up. */
export const emotionIntensityLabels = [
  { min: 0, label: 'Subtle' },
  { min: 50, label: 'Moderate' },
  { min: 75, label: 'Intense' },
  { min: 90, label: 'Extreme' },
] as const

/** Map an intensity value (0–100) to a human-readable label. */
export function getIntensityLabel(value: number): string {
  let label: string = emotionIntensityLabels[0].label
  for (const bucket of emotionIntensityLabels) {
    if (value >= bucket.min) label = bucket.label
  }
  return label
}
