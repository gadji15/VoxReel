'use client'

/**
 * VoxReel — create-flow project bridge
 *
 * Reads `?projectId=<uuid>` from the URL (client-side) and hydrates the
 * CreateFlowProvider for that project. Lives inside the provider, rendered by
 * the create layout under a Suspense boundary (required for `useSearchParams`).
 *
 * Strategy: prefer a project-scoped local draft (keeps unsaved edits), else
 * fetch from Supabase via a server action. If the project is missing/not owned,
 * redirect to /app/projects. With no `projectId` (mock/dev), it does nothing.
 */

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateFlow, loadLocalDraftForProject } from './CreateFlowProvider'
import { getCreateFlowDraftAction } from '@/app/app/create/actions'
import { ROUTES } from '@/lib/routes'

export function CreateFlowProjectBridge() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  const { state, hydrateDraft } = useCreateFlow()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    if (projectId === state.currentProjectId) return
    if (handledRef.current === projectId) return
    handledRef.current = projectId

    // Local draft for this exact project wins (preserves unsaved edits).
    const local = loadLocalDraftForProject(projectId)
    if (local) {
      hydrateDraft(local)
      return
    }

    let cancelled = false
    getCreateFlowDraftAction(projectId)
      .then((draft) => {
        if (cancelled) return
        if (draft) hydrateDraft(draft)
        else router.replace(ROUTES.PROJECTS) // invalid / not owned
      })
      .catch(() => {
        /* keep mock state; never crash the flow */
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, state.currentProjectId])

  return null
}
