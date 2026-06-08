/**
 * VoxReel — render timeline builder (pure)
 *
 * Turns DB rows (scenes, selected_clips, captions, audio) into a serializable
 * 1080×1920 render plan. No DB/IO here — the render service loads the rows and
 * calls this. Keeps output predictable and easy to test.
 */

import type { Database } from '@/lib/supabase/database.types'
import { getEmotionColor } from '@/lib/emotions'
import type { RenderTimeline, RenderScene, RenderAsset } from './types'

type SceneRow = Database['public']['Tables']['scenes']['Row']
type SelectedClipRow = Database['public']['Tables']['selected_clips']['Row']
type CaptionRow = Database['public']['Tables']['captions']['Row']
type AudioRow = Database['public']['Tables']['audio_files']['Row']

export const RENDER_WIDTH = 1080
export const RENDER_HEIGHT = 1920
export const RENDER_FPS = 30

/** Minimum on-screen duration per scene (seconds) so nothing flashes by. */
const MIN_SCENE_SECONDS = 1.5

export interface TimelineInput {
  scenes: SceneRow[]
  selectedClips: SelectedClipRow[]
  captions: CaptionRow[]
  audio: AudioRow | null
}

export function buildRenderTimeline({
  scenes,
  selectedClips,
  captions,
  audio,
}: TimelineInput): RenderTimeline {
  const clipByScene = new Map(selectedClips.map((c) => [c.scene_id, c]))

  // Caption text per scene_id (first caption wins), used in preference to text.
  const captionByScene = new Map<string, string>()
  for (const cap of captions) {
    if (cap.scene_id && !captionByScene.has(cap.scene_id) && cap.text.trim()) {
      captionByScene.set(cap.scene_id, cap.text)
    }
  }

  const ordered = [...scenes].sort((a, b) => a.scene_index - b.scene_index)

  const renderScenes: RenderScene[] = ordered.map((row, i) => {
    const start = Number(row.start_time_seconds) || 0
    const end = Number(row.end_time_seconds) || start
    const duration = Math.max(MIN_SCENE_SECONDS, end - start || MIN_SCENE_SECONDS)
    const clip = clipByScene.get(row.id)
    const cached = clip && clip.storage_bucket && clip.storage_path
    const text = (captionByScene.get(row.id) || row.title || row.text || '').trim()

    return {
      index: i + 1,
      startSeconds: start,
      endSeconds: end,
      durationSeconds: duration,
      text,
      emotion: row.emotion ?? 'Neutral',
      emotionColor: row.emotion_color ?? getEmotionColor(row.emotion ?? ''),
      clipBucket: cached ? clip!.storage_bucket : null,
      clipPath: cached ? clip!.storage_path : null,
      hasClip: Boolean(cached),
    }
  })

  const totalDurationSeconds = renderScenes.reduce((sum, s) => sum + s.durationSeconds, 0)

  const audioAsset: RenderAsset | null =
    audio && audio.storage_bucket && audio.storage_path
      ? { bucket: audio.storage_bucket, path: audio.storage_path }
      : null

  return {
    width: RENDER_WIDTH,
    height: RENDER_HEIGHT,
    fps: RENDER_FPS,
    totalDurationSeconds,
    scenes: renderScenes,
    audio: audioAsset,
  }
}
