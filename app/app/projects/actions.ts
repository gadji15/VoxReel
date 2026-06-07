'use server'

/**
 * VoxReel — project server actions
 *
 * Thin `'use server'` wrappers around the projects service, callable from client
 * components. Scope: create / archive / delete projects only. The create flow
 * itself stays mock-driven for now; we only carry `projectId` in the URL so a
 * future task can hydrate the provider from Supabase.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createProject,
  archiveProject,
  deleteProject,
} from '@/lib/services/projects.service'
import { ROUTES } from '@/lib/routes'

/**
 * Create a real draft project for the current user, then enter the (still mock)
 * create flow with the new `projectId` in the URL.
 */
export async function createNewProjectAction(): Promise<void> {
  const project = await createProject()
  // redirect() must run outside any try/catch (it throws NEXT_REDIRECT).
  redirect(`${ROUTES.CREATE_UPLOAD}?projectId=${project.id}`)
}

/** Archive (soft-delete) a project and refresh the lists. */
export async function archiveProjectAction(projectId: string): Promise<void> {
  await archiveProject(projectId)
  revalidatePath(ROUTES.APP)
  revalidatePath(ROUTES.PROJECTS)
}

/** Hard-delete a project and refresh the lists. */
export async function deleteProjectAction(projectId: string): Promise<void> {
  await deleteProject(projectId)
  revalidatePath(ROUTES.APP)
  revalidatePath(ROUTES.PROJECTS)
}
