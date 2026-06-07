/**
 * VoxReel — create-flow mappers (Supabase rows ↔ CreateFlowProvider state)
 *
 * Pure functions. Bridge the DB schema (numeric seconds, uuid ids, snake_case)
 * to the provider's UI draft shape (m:ss strings, numeric scene ids, camelCase)
 * and back to insert payloads.
 *
 * Empty-project strategy: if a real project has NO transcript/scenes/captions
 * yet, we seed the provider with the mock content (so the create flow stays
 * usable) while keeping the project's real identity + settings. Real content
 * replaces the seed once analysis persists it.
 */

import type {
  CreateFlowState,
  Scene,
  TranscriptLine,
  Caption,
  ExportMetadata,
  VisualSource,
} from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'
import { getEmotionColor } from '@/lib/emotions'
import { formatDuration } from '@/lib/mappers/project.mapper'
import { mockScenes, mockTranscript, mockCaptions } from '@/lib/mock-data'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type SceneRow = Database['public']['Tables']['scenes']['Row']
type TranscriptRow = Database['public']['Tables']['transcript_segments']['Row']
type CaptionRow = Database['public']['Tables']['captions']['Row']
type ExportRow = Database['public']['Tables']['exports']['Row']

type SceneInsert = Database['public']['Tables']['scenes']['Insert']
type TranscriptInsert = Database['public']['Tables']['transcript_segments']['Insert']
type CaptionInsert = Database['public']['Tables']['captions']['Insert']

/** Parse a `m:ss` (or plain seconds) timecode into seconds. */
export function parseTimecode(tc: string | null | undefined): number {
  if (!tc) return 0
  const parts = String(tc).split(':').map((p) => Number(p))
  if (parts.some((n) => Number.isNaN(n))) return 0
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

function metaRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/* ── DB → provider ───────────────────────────────────────────────────────── */

export function mapSceneRowToProvider(row: SceneRow, total: number): Scene {
  const meta = metaRecord(row.metadata)
  return {
    id: row.scene_index,
    index: row.scene_index,
    total,
    timeStart: formatDuration(row.start_time_seconds),
    timeEnd: formatDuration(row.end_time_seconds),
    emotion: row.emotion ?? 'Numbness',
    emotionColor: row.emotion_color ?? getEmotionColor(row.emotion ?? ''),
    intensity: row.intensity,
    text: row.text,
    visualIntent: row.visual_intent ?? '',
    clip: typeof meta.clip === 'string' ? meta.clip : '',
    clipMatch: typeof meta.clipMatch === 'number' ? meta.clipMatch : 0,
    motion: row.motion_preset ?? 'Static Hold',
    transition: row.transition_preset ?? 'Hard Cut',
    locked: row.locked,
  }
}

export function mapTranscriptRowToProvider(row: TranscriptRow): TranscriptLine {
  return {
    id: row.segment_index,
    start: formatDuration(row.start_time_seconds),
    text: row.text,
  }
}

export function mapCaptionRowToProvider(row: CaptionRow): Caption {
  return {
    id: row.caption_index,
    start: formatDuration(row.start_time_seconds),
    text: row.text,
    style: row.style ?? 'bold-center',
  }
}

export function mapExportRowToProvider(row: ExportRow | null): ExportMetadata {
  if (!row) {
    return {
      fileName: null,
      resolution: '1080 × 1920',
      quality: '1080p',
      format: 'MP4',
      duration: null,
      size: null,
      createdAt: null,
    }
  }
  return {
    fileName: row.file_name,
    resolution: `${row.resolution_width} × ${row.resolution_height}`,
    quality: `${row.resolution_height}p`,
    format: (row.format ?? 'mp4').toUpperCase(),
    duration: row.duration_seconds != null ? formatDuration(row.duration_seconds) : null,
    size: row.size_bytes != null ? `${(row.size_bytes / 1_000_000).toFixed(1)} MB` : null,
    createdAt: row.created_at,
  }
}

export interface DbDraftInput {
  project: ProjectRow
  segments: TranscriptRow[]
  scenes: SceneRow[]
  captions: CaptionRow[]
  exportRow: ExportRow | null
}

/** Assemble the full provider draft from DB rows (with mock seed fallbacks). */
export function mapDbToCreateFlowState({
  project,
  segments,
  scenes,
  captions,
  exportRow,
}: DbDraftInput): CreateFlowState {
  const hasScenes = scenes.length > 0
  const mappedScenes: Scene[] = hasScenes
    ? scenes.map((s) => mapSceneRowToProvider(s, scenes.length))
    : mockScenes.map((s) => ({ ...s }))

  const transcript: TranscriptLine[] =
    segments.length > 0
      ? segments.map(mapTranscriptRowToProvider)
      : mockTranscript.map((l) => ({ ...l }))

  const mappedCaptions: Caption[] =
    captions.length > 0
      ? captions.map(mapCaptionRowToProvider)
      : mockCaptions.map((c) => ({ ...c }))

  return {
    currentProjectId: project.id,
    projectTitle: project.title,
    language: project.language,
    storyStyle: project.story_style ?? 'noir',
    visualSource: (project.visual_source as VisualSource) ?? 'stock',
    captionStyle: project.caption_style ?? 'bold-center',
    audio: {
      fileName: 'voice-story.m4a',
      duration: project.duration_seconds > 0 ? formatDuration(project.duration_seconds) : '1:18',
      size: '2.4 MB',
      mimeType: 'audio/mp4',
      status: 'ready',
    },
    transcript,
    scenes: mappedScenes,
    captions: mappedCaptions,
    selectedSceneId: mappedScenes[0]?.id ?? null,
    renderStatus: exportRow ? 'complete' : 'idle',
    export: mapExportRowToProvider(exportRow),
    updatedAt: project.updated_at,
  }
}

/* ── provider → DB insert payloads ───────────────────────────────────────── */

export function mapProviderScenesToInsert(
  scenes: Scene[],
  projectId: string,
  userId: string
): SceneInsert[] {
  return scenes.map((scene, i) => {
    const start = parseTimecode(scene.timeStart)
    // Enforce the DB check (end_time_seconds > start_time_seconds).
    const end = Math.max(parseTimecode(scene.timeEnd), start + 1)
    return {
      project_id: projectId,
      user_id: userId,
      scene_index: scene.index || i + 1,
      start_time_seconds: start,
      end_time_seconds: end,
      text: scene.text,
      emotion: scene.emotion,
      emotion_color: scene.emotionColor,
      intensity: Math.min(100, Math.max(0, scene.intensity)),
      visual_intent: scene.visualIntent,
      motion_preset: scene.motion,
      transition_preset: scene.transition,
      locked: scene.locked ?? false,
      metadata: { clip: scene.clip, clipMatch: scene.clipMatch },
    }
  })
}

export function mapProviderTranscriptToInsert(
  lines: TranscriptLine[],
  projectId: string,
  userId: string
): TranscriptInsert[] {
  return lines.map((line, i) => {
    const start = parseTimecode(line.start)
    const next = lines[i + 1]
    const end = next ? parseTimecode(next.start) : start + 3
    return {
      project_id: projectId,
      user_id: userId,
      segment_index: line.id ?? i + 1,
      start_time_seconds: start,
      end_time_seconds: Math.max(end, start),
      text: line.text,
    }
  })
}

export function mapProviderCaptionsToInsert(
  captions: Caption[],
  projectId: string,
  userId: string
): CaptionInsert[] {
  return captions.map((c, i) => {
    const start = parseTimecode(c.start)
    return {
      project_id: projectId,
      user_id: userId,
      caption_index: c.id ?? i + 1,
      start_time_seconds: start,
      end_time_seconds: start + 2,
      text: c.text,
      style: c.style,
    }
  })
}

/** Compute total duration (seconds) from the last scene's end time. */
export function computeDurationSeconds(scenes: Scene[]): number {
  return scenes.reduce((max, s) => Math.max(max, parseTimecode(s.timeEnd)), 0)
}
