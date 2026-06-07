'use server'

/**
 * VoxReel — create-flow server actions
 *
 * Thin `'use server'` wrappers callable from the client create-flow screens.
 * Scope: hydrate a project's draft + persist settings/transcript/scenes/captions.
 * No audio upload / transcription / rendering here — content is still seeded
 * from mock data on the client; these actions just persist it.
 */

import {
  getCreateFlowDraft,
  updateProjectSettings,
  saveTranscriptSegments,
  saveScenes,
  saveCaptions,
  type ProjectSettingsInput,
} from '@/lib/services/create-flow.service'
import { mapDbToCreateFlowState } from '@/lib/mappers/create-flow.mapper'
import type { CreateFlowState, Scene, TranscriptLine, Caption } from '@/lib/types'

/**
 * Fetch + map a project's draft into provider state. Returns `null` when the
 * project is missing or not owned by the user (caller redirects to /app/projects).
 */
export async function getCreateFlowDraftAction(
  projectId: string
): Promise<CreateFlowState | null> {
  const draft = await getCreateFlowDraft(projectId)
  if (!draft) return null
  return mapDbToCreateFlowState(draft)
}

/** Persist project settings (language / style / footage / captions / title). */
export async function updateProjectSettingsAction(
  projectId: string,
  input: ProjectSettingsInput
): Promise<void> {
  await updateProjectSettings(projectId, input)
}

/** Persist the transcript (replace strategy). */
export async function saveTranscriptAction(
  projectId: string,
  transcript: TranscriptLine[]
): Promise<void> {
  await saveTranscriptSegments(projectId, transcript)
}

/** Persist the scenes (replace strategy). */
export async function saveScenesAction(projectId: string, scenes: Scene[]): Promise<void> {
  await saveScenes(projectId, scenes)
}

/**
 * Persist a freshly-analyzed draft (transcript + scenes + captions) in one call,
 * replacing any existing rows. Used when the mock analysis completes.
 */
export async function saveAnalysisAction(
  projectId: string,
  payload: { transcript: TranscriptLine[]; scenes: Scene[]; captions: Caption[] }
): Promise<void> {
  await saveTranscriptSegments(projectId, payload.transcript)
  await saveScenes(projectId, payload.scenes)
  await saveCaptions(projectId, payload.captions)
}
