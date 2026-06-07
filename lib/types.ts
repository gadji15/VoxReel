/**
 * VoxReel — shared UI types
 *
 * These describe the *shape of the mock/UI data* used by the current
 * frontend-only skeleton. They are intentionally light-weight and should NOT
 * be treated as the database schema. When the backend is introduced, the
 * canonical schema will live alongside the API layer (see
 * `docs/05-database-schema.md`) and these types can be derived from it.
 */

/** Publishing status of a project/reel. */
export type ProjectStatus = 'complete' | 'rendering' | 'draft'

/** Target social platform for a vertical 9:16 reel. */
export type Platform = 'tiktok' | 'instagram' | 'youtube'

/** A saved reel project shown in the dashboard / library. */
export interface Project {
  id: string
  title: string
  /** Display duration, formatted as `m:ss` (e.g. `1:18`). */
  duration: string
  /** Number of scenes — must match the project's storyboard length. */
  scenes: number
  status: ProjectStatus
  thumbnail: string | null
  /** Human-readable relative time (e.g. `2 hours ago`). */
  createdAt: string
  platform: Platform
  /** Formatted view count for published reels, otherwise `null`. */
  views: string | null
}

/** A single storyboard scene within a reel. */
export interface Scene {
  id: number
  /** 1-based position of this scene in the storyboard. */
  index: number
  /** Total number of scenes in the storyboard (kept in sync with the array). */
  total: number
  /** Scene start timecode, formatted as `m:ss`. */
  timeStart: string
  /** Scene end timecode, formatted as `m:ss`. */
  timeEnd: string
  /** Detected dominant emotion label. */
  emotion: string
  /** Hex color associated with the emotion. */
  emotionColor: string
  /** Emotional intensity, 0–100. */
  intensity: number
  /** The spoken/caption text for this scene. */
  text: string
  /** Director-style description of the intended visual. */
  visualIntent: string
  /** Human-readable description of the matched stock clip. */
  clip: string
  /** AI clip-match confidence, 0–100. */
  clipMatch: number
  /** Name of the applied camera-motion preset. */
  motion: string
  /** Name of the applied transition preset. */
  transition: string
  /** When locked, automated re-generation should not overwrite this scene. */
  locked?: boolean
  /** DB uuid of the scene (present when hydrated from Supabase). */
  dbId?: string
  /** Selected stock-clip media (present once stock search has run). */
  clipThumbnailUrl?: string | null
  clipPreviewUrl?: string | null
  clipSourceUrl?: string | null
  clipProvider?: string | null
  /** Cached-clip location in Supabase Storage (present once the clip is cached). */
  clipCachedBucket?: string | null
  clipCachedPath?: string | null
}

/** A cinematic style/look preset. */
export interface Style {
  id: string
  name: string
  desc: string
  tag: string
}

/** A single timestamped transcript line. */
export interface TranscriptLine {
  id: number
  /** Line start timecode, formatted as `m:ss`. */
  start: string
  text: string
}

/** A camera-motion preset shown in the motion editor. */
export interface MotionPreset {
  id: string
  name: string
  /** Glyph/emoji used as a lightweight visual indicator. */
  icon: string
  desc: string
}

/** A scene-to-scene transition preset. */
export interface TransitionPreset {
  id: string
  name: string
  desc: string
}

/** A caption overlay tied to a point in the timeline. */
export interface Caption {
  id: number
  text: string
  /** Caption start timecode, formatted as `m:ss`. */
  start: string
  /** Style preset key (e.g. `bold-center`). */
  style: string
}

/* ──────────────────────────────────────────────────────────────────────────
 * Create-flow draft state (frontend-only)
 *
 * Shapes for the shared `/app/create/*` draft managed by CreateFlowProvider.
 * These are UI/draft types — NOT a backend schema. No upload/transcription/AI
 * is implemented; statuses below are mock lifecycle markers only.
 * ────────────────────────────────────────────────────────────────────────── */

/** Lifecycle of the (mock) source audio. */
export type AudioStatus = 'idle' | 'recording' | 'uploading' | 'ready' | 'error'

/** Lifecycle of the (mock) render job. */
export type RenderStatus = 'idle' | 'rendering' | 'complete' | 'error'

/** Where scene footage comes from (mock — no real provider calls). */
export type VisualSource = 'stock' | 'pexels' | 'pixabay' | 'upload' | 'mixed'

/** Metadata describing the source audio for a draft. */
export interface AudioMetadata {
  fileName: string | null
  /** Duration formatted as `m:ss`. */
  duration: string | null
  /** Human-readable size (e.g. `3.4 MB`). */
  size: string | null
  mimeType: string | null
  status: AudioStatus
  /** Supabase Storage bucket the file lives in (when really uploaded). */
  storageBucket?: string | null
  /** Object path within the bucket: `{user_id}/{project_id}/original.{ext}`. */
  storagePath?: string | null
}

/** Metadata describing the (mock) exported reel. */
export interface ExportMetadata {
  fileName: string | null
  /** e.g. `1080 × 1920`. */
  resolution: string | null
  /** e.g. `1080p`. */
  quality: string | null
  format: string | null
  /** Duration formatted as `m:ss`. */
  duration: string | null
  /** Human-readable estimated size (e.g. `24.8 MB`). */
  size: string | null
  /** ISO timestamp of when the (mock) export was produced, else `null`. */
  createdAt: string | null
}

/**
 * The full draft state shared across the create flow. Persisted to
 * localStorage (client only) under `voxreel:create-flow-draft`.
 */
export interface CreateFlowState {
  currentProjectId: string | null
  projectTitle: string
  /** BCP-47-ish language label (e.g. `English`). */
  language: string
  /** Selected story/visual style preset id (e.g. `noir`). */
  storyStyle: string
  visualSource: VisualSource
  /** Selected caption style preset key (e.g. `bold-center`). */
  captionStyle: string
  audio: AudioMetadata
  transcript: TranscriptLine[]
  scenes: Scene[]
  captions: Caption[]
  selectedSceneId: number | null
  renderStatus: RenderStatus
  export: ExportMetadata
  /** ISO timestamp of the last mutation. */
  updatedAt: string
}
