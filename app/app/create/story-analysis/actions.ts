'use server'

/**
 * VoxReel — story-analysis server actions
 *
 * Server-only entry points for narrative analysis + scene splitting. They run
 * the service, return clean serializable results, and never expose secrets.
 */

import {
  analyzeProjectStory,
  getProjectScenes,
} from '@/lib/services/story-analysis.service'
import type { Scene } from '@/lib/types'

export interface StoryAnalysisActionResult {
  ok: boolean
  scenes: Scene[]
  error?: string
}

/** Generate + persist scenes from the project's real transcript. */
export async function analyzeProjectStoryAction(
  projectId: string
): Promise<StoryAnalysisActionResult> {
  try {
    const scenes = await analyzeProjectStory(projectId)
    return { ok: true, scenes }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Story analysis failed.'
    return { ok: false, scenes: [], error }
  }
}

/** Read the project's already-saved scenes (provider-shaped). */
export async function getProjectScenesAction(projectId: string): Promise<Scene[]> {
  return getProjectScenes(projectId)
}
