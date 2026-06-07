/**
 * VoxReel — story analysis types
 *
 * Shapes for the OpenAI narrative-analysis step that turns the real
 * `transcript_segments` into cinematic vertical-reel scenes. Kept compatible
 * with the provider `Scene` type and the `scenes` DB table.
 */

/** Motion preset KEYS the model must choose from (normalized to UI names later). */
export const MOTION_PRESET_KEYS = [
  'slow_push',
  'pull_back',
  'zoom_out',
  'shake',
  'static',
  'drift',
] as const

/** Transition preset KEYS the model must choose from. */
export const TRANSITION_PRESET_KEYS = [
  'hard_cut',
  'cross_dissolve',
  'fade',
  'glitch',
  'whip',
  'match',
] as const

/** Common narrative emotions (free-form string is still accepted). */
export const STORY_EMOTIONS = [
  'fear',
  'anger',
  'sadness',
  'hope',
  'betrayal',
  'tension',
  'relief',
  'dread',
  'shock',
  'rage',
  'grief',
  'resolve',
  'joy',
  'calm',
  'neutral',
] as const

export type StoryEmotion = (typeof STORY_EMOTIONS)[number] | (string & {})

/** A single transcript segment fed into the analyzer. */
export interface TranscriptSegmentForAnalysis {
  index: number
  start: number
  end: number
  text: string
}

/** Inputs used to build the analysis prompt. */
export interface StoryAnalysisInput {
  segments: TranscriptSegmentForAnalysis[]
  durationSeconds: number
  storyStyle: string
  language: string
  visualSource: string
  captionStyle: string
}

/** One scene as returned by the model (pre-normalization). */
export interface AnalyzedScene {
  scene_index: number
  start_time_seconds: number
  end_time_seconds: number
  title: string
  text: string
  emotion: string
  emotion_color: string
  intensity: number
  visual_intent: string
  search_query: string
  motion_preset: string
  transition_preset: string
  caption_hint: string
}

/** The full structured response from the model. */
export interface StoryAnalysisResult {
  summary: string
  language: string
  overall_emotion: string
  scenes: AnalyzedScene[]
}
