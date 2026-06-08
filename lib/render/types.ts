/**
 * VoxReel — render types
 *
 * Shapes for the MVP renderer: build a 1080×1920 timeline from the project's
 * scenes + cached clips + audio, render an MP4, and record the export.
 */

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed'

/** One scene in the render plan. */
export interface RenderScene {
  index: number
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  /** Caption/overlay text (from caption rows, else scene text/title). */
  text: string
  emotion: string
  /** Hex color used as a fallback background when no clip is available. */
  emotionColor: string
  /** Cached clip location (preferred), if present. */
  clipBucket: string | null
  clipPath: string | null
  hasClip: boolean
}

/** A storage object to download before rendering. */
export interface RenderAsset {
  bucket: string
  path: string
}

/** The full, serializable render plan. */
export interface RenderTimeline {
  width: number
  height: number
  fps: number
  totalDurationSeconds: number
  scenes: RenderScene[]
  audio: RenderAsset | null
}

export interface RenderInput {
  projectId: string
}

export interface RenderProgressUpdate {
  progress: number
  currentStep: string
}

/** Export metadata returned to the UI (serializable). */
export interface RenderExportMetadata {
  exportId: string
  fileName: string
  storageBucket: string
  storagePath: string
  format: string
  mimeType: string
  durationSeconds: number
  sizeBytes: number
  width: number
  height: number
  fps: number
  createdAt: string
  /** Short-lived signed URL for download (may be null). */
  downloadUrl: string | null
}

export interface RenderResult {
  ok: boolean
  jobId?: string
  status: RenderJobStatus
  export?: RenderExportMetadata
  error?: string
}
