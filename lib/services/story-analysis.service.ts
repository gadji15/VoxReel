import 'server-only'

/**
 * VoxReel — story analysis service (SERVER-ONLY)
 *
 * Turns the project's persisted `transcript_segments` into cinematic vertical
 * scenes using OpenAI (structured JSON output), normalizes/validates the result,
 * and REPLACES the project's `scenes` (only once valid scenes exist — never with
 * empty/invalid output). Server-only; never uses the admin/service-role client.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createOpenAIClient } from '@/lib/openai/client'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import type { Scene } from '@/lib/types'
import { getEmotionColor } from '@/lib/emotions'
import { formatDuration } from '@/lib/mappers/project.mapper'
import { mapSceneRowToProvider } from '@/lib/mappers/create-flow.mapper'
import { buildStoryAnalysisMessages } from '@/lib/story-analysis/prompt'
import {
  MOTION_PRESET_KEYS,
  TRANSITION_PRESET_KEYS,
  type AnalyzedScene,
  type StoryAnalysisResult,
  type TranscriptSegmentForAnalysis,
} from '@/lib/story-analysis/types'

type ProjectRow = Database['public']['Tables']['projects']['Row']

/** Structured-output model. */
export const STORY_MODEL = 'gpt-4o-mini'

export const STATUS_ANALYZING = 'analyzing_story'
export const STATUS_STORYBOARD_READY = 'storyboard_ready'
export const STATUS_FAILED = 'failed'

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

/* ── Normalization helpers ──────────────────────────────────────────────── */

const MOTION_NAME: Record<string, string> = {
  slow_push: 'Slow Push-In', push: 'Slow Push-In', push_in: 'Slow Push-In',
  pull_back: 'Pull Back Wide', pullback: 'Pull Back Wide', pull_back_wide: 'Pull Back Wide',
  zoom_out: 'Zoom Out Fast', zoom: 'Zoom Out Fast', zoom_out_fast: 'Zoom Out Fast',
  shake: 'Shake + Zoom', shake_zoom: 'Shake + Zoom',
  static: 'Static Hold', hold: 'Static Hold', static_hold: 'Static Hold',
  drift: 'Gentle Drift', gentle_drift: 'Gentle Drift',
}

const TRANSITION_NAME: Record<string, string> = {
  hard_cut: 'Hard Cut', cut: 'Hard Cut',
  cross_dissolve: 'Cross Dissolve', dissolve: 'Cross Dissolve', crossfade: 'Cross Dissolve',
  fade: 'Fade to Black', fade_to_black: 'Fade to Black', fade_out: 'Fade to Black',
  glitch: 'Glitch Cut', glitch_cut: 'Glitch Cut',
  whip: 'Whip Pan', whip_pan: 'Whip Pan',
  match: 'Match Cut', match_cut: 'Match Cut',
}

function normalizeMotion(key: string): string {
  return MOTION_NAME[(key ?? '').toLowerCase().trim()] ?? 'Slow Push-In'
}
function normalizeTransition(key: string): string {
  return TRANSITION_NAME[(key ?? '').toLowerCase().trim()] ?? 'Cross Dissolve'
}
function isHexColor(c: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((c ?? '').trim())
}
function titleCase(s: string): string {
  const t = (s ?? '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}
function clampIntensity(n: number): number {
  if (!Number.isFinite(n)) return 50
  return Math.min(100, Math.max(0, Math.round(n)))
}

/**
 * Validate + clean the model's scenes. Returns a coherent list (sorted, reindexed
 * from 1, valid times/colors/presets). Returns `[]` if nothing usable.
 */
function normalizeScenes(raw: AnalyzedScene[], maxDuration: number): AnalyzedScene[] {
  const usable = (raw ?? []).filter(
    (s) => (s?.text?.trim()?.length ?? 0) > 0 || (s?.title?.trim()?.length ?? 0) > 0
  )
  usable.sort((a, b) => (a.start_time_seconds ?? 0) - (b.start_time_seconds ?? 0))

  return usable.map((s, i) => {
    const start = Math.max(0, Number(s.start_time_seconds) || 0)
    let end = Number(s.end_time_seconds) || 0
    if (!(end > start)) end = start + Math.max(1, (maxDuration || start + 1) - start) / Math.max(1, usable.length)
    if (!(end > start)) end = start + 1

    const emotion = titleCase(s.emotion) || 'Neutral'
    const color = isHexColor(s.emotion_color) ? s.emotion_color : getEmotionColor(emotion)
    const title = (s.title?.trim() || `Scene ${i + 1}`).slice(0, 80)
    const text = s.text?.trim() || title
    const visual = s.visual_intent?.trim() || 'Cinematic dark atmosphere, moody lighting, faceless'
    const query = s.search_query?.trim() || `${emotion.toLowerCase()} cinematic dark mood`

    return {
      scene_index: i + 1,
      start_time_seconds: start,
      end_time_seconds: end,
      title,
      text,
      emotion,
      emotion_color: color,
      intensity: clampIntensity(s.intensity),
      visual_intent: visual,
      search_query: query,
      motion_preset: normalizeMotion(s.motion_preset),
      transition_preset: normalizeTransition(s.transition_preset),
      caption_hint: s.caption_hint?.trim() ?? '',
    }
  })
}

function analyzedToProvider(scene: AnalyzedScene, total: number): Scene {
  return {
    id: scene.scene_index,
    index: scene.scene_index,
    total,
    timeStart: formatDuration(scene.start_time_seconds),
    timeEnd: formatDuration(scene.end_time_seconds),
    emotion: scene.emotion,
    emotionColor: scene.emotion_color,
    intensity: scene.intensity,
    text: scene.text,
    visualIntent: scene.visual_intent,
    clip: '', // stock-clip matching is a later milestone
    clipMatch: 0,
    motion: scene.motion_preset,
    transition: scene.transition_preset,
    locked: false,
  }
}

/* ── Data access ────────────────────────────────────────────────────────── */

export async function getTranscriptForStoryAnalysis(
  projectId: string
): Promise<{ project: ProjectRow; segments: TranscriptSegmentForAnalysis[] }> {
  const { supabase, user } = await getAuthedContext()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!project) throw new Error('Project not found.')

  const { data: rows } = await supabase
    .from('transcript_segments')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('segment_index', { ascending: true })

  const segments = (rows ?? []).map((r) => ({
    index: r.segment_index,
    start: r.start_time_seconds,
    end: r.end_time_seconds,
    text: r.text,
  }))
  if (segments.length === 0) {
    throw new Error('No transcript found. Please transcribe the audio first.')
  }

  return { project, segments }
}

/** REPLACE the project's scenes with normalized analyzed scenes; returns provider scenes. */
export async function saveAnalyzedScenes(
  projectId: string,
  scenes: AnalyzedScene[]
): Promise<Scene[]> {
  const { supabase, user } = await getAuthedContext()
  if (scenes.length === 0) {
    throw new Error('No valid scenes to save.')
  }

  const del = await supabase
    .from('scenes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (del.error) throw new Error(`Failed to clear old scenes: ${del.error.message}`)

  const rows = scenes.map((s) => ({
    project_id: projectId,
    user_id: user.id,
    scene_index: s.scene_index,
    start_time_seconds: s.start_time_seconds,
    end_time_seconds: Math.max(s.end_time_seconds, s.start_time_seconds + 0.5),
    title: s.title,
    text: s.text,
    emotion: s.emotion,
    emotion_color: s.emotion_color,
    intensity: s.intensity,
    visual_intent: s.visual_intent,
    search_query: s.search_query,
    motion_preset: s.motion_preset,
    transition_preset: s.transition_preset,
    locked: false,
    metadata: { searchQuery: s.search_query, captionHint: s.caption_hint },
  }))

  const { error } = await supabase.from('scenes').insert(rows)
  if (error) throw new Error(`Failed to save scenes: ${error.message}`)

  const duration = scenes.reduce((max, s) => Math.max(max, s.end_time_seconds), 0)
  await supabase
    .from('projects')
    .update({
      total_scenes: scenes.length,
      duration_seconds: duration,
      status: STATUS_STORYBOARD_READY,
    })
    .eq('id', projectId)
    .eq('user_id', user.id)

  return scenes.map((s) => analyzedToProvider(s, scenes.length))
}

/** Read the project's saved scenes as provider scenes. */
export async function getProjectScenes(projectId: string): Promise<Scene[]> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('scene_index', { ascending: true })
  const rows = data ?? []
  return rows.map((r) => mapSceneRowToProvider(r, rows.length))
}

/* ── Pipeline ───────────────────────────────────────────────────────────── */

const STORY_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'language', 'overall_emotion', 'scenes'],
  properties: {
    summary: { type: 'string' },
    language: { type: 'string' },
    overall_emotion: { type: 'string' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'scene_index',
          'start_time_seconds',
          'end_time_seconds',
          'title',
          'text',
          'emotion',
          'emotion_color',
          'intensity',
          'visual_intent',
          'search_query',
          'motion_preset',
          'transition_preset',
          'caption_hint',
        ],
        properties: {
          scene_index: { type: 'integer' },
          start_time_seconds: { type: 'number' },
          end_time_seconds: { type: 'number' },
          title: { type: 'string' },
          text: { type: 'string' },
          emotion: { type: 'string' },
          emotion_color: { type: 'string' },
          intensity: { type: 'integer' },
          visual_intent: { type: 'string' },
          search_query: { type: 'string' },
          motion_preset: { type: 'string', enum: [...MOTION_PRESET_KEYS] },
          transition_preset: { type: 'string', enum: [...TRANSITION_PRESET_KEYS] },
          caption_hint: { type: 'string' },
        },
      },
    },
  },
}

/**
 * Full story-analysis pipeline: load transcript → OpenAI (structured JSON) →
 * normalize/validate → REPLACE scenes → mark `storyboard_ready`. Returns
 * provider-compatible scenes. Throws a clean error on failure WITHOUT touching
 * existing scenes (replace happens only after valid scenes are produced).
 */
export async function analyzeProjectStory(projectId: string): Promise<Scene[]> {
  const { supabase, user } = await getAuthedContext()
  const { project, segments } = await getTranscriptForStoryAnalysis(projectId)

  const durationSeconds =
    segments.reduce((max, s) => Math.max(max, s.end), 0) || project.duration_seconds || 0

  // Best-effort status marker before the (slow) model call.
  await supabase
    .from('projects')
    .update({ status: STATUS_ANALYZING })
    .eq('id', projectId)
    .eq('user_id', user.id)

  try {
    const { system, user: userPrompt } = buildStoryAnalysisMessages({
      segments,
      durationSeconds,
      storyStyle: project.story_style ?? 'noir',
      language: project.language ?? 'English',
      visualSource: project.visual_source ?? 'stock',
      captionStyle: project.caption_style ?? 'bold-center',
    })

    const openai = createOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: STORY_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'voxreel_story_analysis', strict: true, schema: STORY_SCHEMA },
      },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('The story analyzer returned no content.')

    let parsed: StoryAnalysisResult
    try {
      parsed = JSON.parse(content) as StoryAnalysisResult
    } catch {
      throw new Error('The story analyzer returned malformed JSON.')
    }

    const cleaned = normalizeScenes(parsed.scenes ?? [], durationSeconds)
    if (cleaned.length === 0) {
      throw new Error('The story analyzer did not produce any usable scenes.')
    }

    // Replace ONLY now that we have valid scenes.
    return await saveAnalyzedScenes(projectId, cleaned)
  } catch (err) {
    // Mark failed (best-effort) but do NOT delete existing scenes.
    await supabase
      .from('projects')
      .update({ status: STATUS_FAILED })
      .eq('id', projectId)
      .eq('user_id', user.id)
    const message = err instanceof Error ? err.message : 'Story analysis failed.'
    throw new Error(message)
  }
}
