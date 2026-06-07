/**
 * VoxReel — story analysis prompt builder
 *
 * Produces the system + user prompts that instruct OpenAI to split the real
 * transcript into cinematic, faceless-friendly vertical-reel scenes and return
 * STRICT JSON (enforced separately via a json_schema response format).
 */

import {
  type StoryAnalysisInput,
  MOTION_PRESET_KEYS,
  TRANSITION_PRESET_KEYS,
} from './types'

/** Suggested scene count for a given audio duration (seconds). */
export function suggestedSceneRange(durationSeconds: number): string {
  if (durationSeconds <= 30) return '3-5'
  if (durationSeconds <= 60) return '5-8'
  if (durationSeconds <= 120) return '8-12'
  return '10-15'
}

export interface StoryPromptMessages {
  system: string
  user: string
}

export function buildStoryAnalysisMessages(input: StoryAnalysisInput): StoryPromptMessages {
  const { segments, durationSeconds, storyStyle, language, visualSource, captionStyle } = input
  const sceneRange = suggestedSceneRange(durationSeconds)

  const system = [
    'You are a senior short-form storytelling editor for VoxReel, a tool that turns',
    'spoken voice stories into cinematic vertical (9:16) reels for TikTok, Instagram',
    'Reels, and YouTube Shorts.',
    '',
    'Your job: split the provided transcript into emotion-aware, cinematic scenes.',
    '',
    'Hard rules:',
    '- Use ONLY what the transcript actually says. Do NOT invent events, names, or',
    '  facts that are not in the transcript. Preserve its meaning and order.',
    '- Use the REAL transcript timestamps. Each scene’s start/end must lie within the',
    '  transcript’s time range, be contiguous, and have end_time_seconds >',
    '  start_time_seconds.',
    `- Produce a reasonable number of scenes for the audio length: about ${sceneRange} scenes.`,
    '- intensity is an integer 0-100 reflecting emotional weight.',
    '- emotion_color must be a valid hex color (e.g. "#D64545") that matches the mood',
    '  (reds for anger/betrayal, violets/blues for dread/grief, golds for hope/resolve,',
    '  grey for numb/neutral).',
    '- visual_intent must be cinematic and FACELESS-FRIENDLY: describe atmosphere,',
    '  environment, objects, light, and motion rather than identifiable faces. Avoid',
    '  faces unless absolutely necessary to the story.',
    '- search_query is a short, concrete stock-footage query (3-8 words) for finding a',
    '  matching vertical clip later. No punctuation, just keywords.',
    '- title is a short, readable scene title (max ~6 words).',
    `- motion_preset MUST be one of: ${MOTION_PRESET_KEYS.join(', ')}.`,
    `- transition_preset MUST be one of: ${TRANSITION_PRESET_KEYS.join(', ')}.`,
    '- caption_hint is a short optional caption direction (may be an empty string).',
    '',
    'Return STRICT JSON only, matching the provided schema. No prose, no markdown.',
  ].join('\n')

  const transcriptBlock = segments
    .map((s) => `[${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s] ${s.text.trim()}`)
    .join('\n')

  const user = [
    'STYLE CONTEXT',
    `- story_style: ${storyStyle}`,
    `- language: ${language}`,
    `- visual_source: ${visualSource}`,
    `- caption_style: ${captionStyle}`,
    `- audio_duration_seconds: ${durationSeconds.toFixed(2)}`,
    '',
    'TRANSCRIPT (timestamped segments):',
    transcriptBlock,
    '',
    'Split this into cinematic vertical-reel scenes following all rules above and',
    'return the JSON object.',
  ].join('\n')

  return { system, user }
}
