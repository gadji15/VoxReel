/**
 * VoxReel — browser audio upload helper
 *
 * Validates + uploads a user's audio file straight from the browser to the
 * private Supabase Storage bucket `audio-files`, using ONLY the anon browser
 * client (RLS + the storage policy from migration 001 enforce ownership).
 *
 * Path convention: `{user_id}/{project_id}/original.{ext}` — the first segment
 * MUST be the user's id so the storage RLS policy allows the write.
 *
 * No server-only code, no service role, no secrets here.
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export const AUDIO_BUCKET = 'audio-files'

/** Accepted MIME types. */
export const ALLOWED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
]

/** Accepted file extensions. */
export const ALLOWED_AUDIO_EXT = ['mp3', 'm4a', 'wav', 'webm', 'ogg', 'mp4']

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024 // 50 MB
export const MIN_AUDIO_SECONDS = 5
export const MAX_AUDIO_SECONDS = 180

export interface AudioUploadResult {
  fileName: string
  storageBucket: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  /** Seconds, or `null` when it couldn't be read client-side. */
  durationSeconds: number | null
  status: 'ready'
}

/** Lowercased file extension (without the dot), or '' if none. */
export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : ''
}

export interface ValidationResult {
  ok: boolean
  error?: string
}

/** Validate type + size (duration is validated separately, once known). */
export function validateAudioFile(file: File): ValidationResult {
  const ext = getFileExtension(file.name)
  const mimeOk = file.type ? ALLOWED_AUDIO_MIME.includes(file.type) : true
  const extOk = ALLOWED_AUDIO_EXT.includes(ext)

  // Accept when EITHER the mime or the extension is recognized (browsers report
  // inconsistent mime types for m4a/etc.), but reject when both look wrong.
  if (!extOk && !mimeOk) {
    return { ok: false, error: 'Unsupported file type. Use MP3, M4A, WAV, WEBM, OGG, or MP4.' }
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { ok: false, error: 'File is too large. The maximum size is 50 MB.' }
  }
  if (file.size === 0) {
    return { ok: false, error: 'That file appears to be empty.' }
  }
  return { ok: true }
}

/** Validate a known duration against the MVP bounds. `null` is allowed. */
export function validateAudioDuration(seconds: number | null): ValidationResult {
  if (seconds == null) return { ok: true } // unknown — allowed (documented)
  if (seconds < MIN_AUDIO_SECONDS) {
    return { ok: false, error: `Audio is too short. Please use at least ${MIN_AUDIO_SECONDS}s.` }
  }
  if (seconds > MAX_AUDIO_SECONDS) {
    return { ok: false, error: `Audio is too long. The maximum is ${MAX_AUDIO_SECONDS}s for now.` }
  }
  return { ok: true }
}

/**
 * Read an audio file's duration via a temporary <audio> element. Resolves to
 * `null` (never rejects) when the duration can't be determined, and always
 * revokes the object URL. Times out after a few seconds so the UI never hangs.
 */
export function getAudioDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      resolve(null)
      return
    }

    let settled = false
    const url = URL.createObjectURL(file)
    const audio = new Audio()

    const cleanup = (value: number | null) => {
      if (settled) return
      settled = true
      audio.removeAttribute('src')
      URL.revokeObjectURL(url)
      resolve(value)
    }

    const timeout = window.setTimeout(() => cleanup(null), 8000)

    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      window.clearTimeout(timeout)
      const d = audio.duration
      cleanup(Number.isFinite(d) && d > 0 ? Math.round(d) : null)
    }
    audio.onerror = () => {
      window.clearTimeout(timeout)
      cleanup(null)
    }
    audio.src = url
  })
}

/** Human-readable byte size (e.g. `3.4 MB`). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface UploadArgs {
  file: File
  projectId: string
  /** Owner id — must match `auth.uid()` for the storage policy to allow it. */
  userId: string
  /** Pre-computed duration (seconds) if the caller already read it. */
  durationSeconds?: number | null
}

/**
 * Upload the file to `audio-files/{userId}/{projectId}/original.{ext}` and return
 * metadata for the DB + provider. Throws a friendly Error on failure.
 */
export async function uploadAudioFile({
  file,
  projectId,
  userId,
  durationSeconds = null,
}: UploadArgs): Promise<AudioUploadResult> {
  const ext = getFileExtension(file.name) || 'mp3'
  const storagePath = `${userId}/${projectId}/original.${ext}`
  const supabase = createSupabaseBrowserClient()

  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: '3600',
  })

  if (error) {
    // Don't leak internals; hint at the most common cause (bucket policy).
    const message =
      /row-level security|not authorized|permission|policy/i.test(error.message)
        ? 'Upload was rejected. Please check that the "audio-files" storage bucket and policies exist.'
        : 'Upload failed. Please try again.'
    throw new Error(message)
  }

  return {
    fileName: file.name,
    storageBucket: AUDIO_BUCKET,
    storagePath,
    mimeType: file.type || `audio/${ext}`,
    sizeBytes: file.size,
    durationSeconds,
    status: 'ready',
  }
}
