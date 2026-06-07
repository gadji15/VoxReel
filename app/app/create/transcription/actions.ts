'use server'

/**
 * VoxReel — transcription server actions
 *
 * Server-only entry points for the create flow. They validate ownership through
 * the service, run/return transcription, and surface clean, serializable
 * results. Secrets (OpenAI key) are never returned or logged with values.
 */

import {
  transcribeProjectAudio,
  getProjectTranscript,
} from '@/lib/services/transcription.service'
import type { TranscriptLine } from '@/lib/types'

export interface TranscriptionResult {
  ok: boolean
  transcript: TranscriptLine[]
  error?: string
}

/** Run the real transcription pipeline for a project and return its lines. */
export async function transcribeProjectAudioAction(
  projectId: string
): Promise<TranscriptionResult> {
  try {
    const transcript = await transcribeProjectAudio(projectId)
    return { ok: true, transcript }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Transcription failed.'
    return { ok: false, transcript: [], error }
  }
}

/** Return the project's already-saved transcript (empty array if none). */
export async function getTranscriptAction(projectId: string): Promise<TranscriptLine[]> {
  return getProjectTranscript(projectId)
}
