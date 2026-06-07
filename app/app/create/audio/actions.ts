'use server'

/**
 * VoxReel — audio server actions
 *
 * Persist `audio_files` metadata after the browser uploads the file to Supabase
 * Storage. These actions never receive the File itself — only its metadata.
 * Scope: audio metadata only (no transcription/analysis here).
 */

import {
  getProjectAudio,
  upsertAudioFileRecord,
  deleteProjectAudio,
  type AudioFileInput,
} from '@/lib/services/audio.service'
import { mapAudioRowToProvider } from '@/lib/mappers/create-flow.mapper'
import type { AudioMetadata } from '@/lib/types'

/**
 * Record uploaded-audio metadata for the current user's project and advance the
 * project status. Returns provider-shaped metadata for `setAudioMetadata`.
 */
export async function saveAudioMetadataAction(
  projectId: string,
  input: AudioFileInput
): Promise<AudioMetadata> {
  const row = await upsertAudioFileRecord(projectId, input)
  return mapAudioRowToProvider(row)
}

/** Fetch the project's stored audio metadata (provider-shaped), or `null`. */
export async function getAudioMetadataAction(projectId: string): Promise<AudioMetadata | null> {
  const row = await getProjectAudio(projectId)
  return row ? mapAudioRowToProvider(row) : null
}

/** Remove the project's audio metadata row. */
export async function deleteAudioMetadataAction(projectId: string): Promise<void> {
  await deleteProjectAudio(projectId)
}
