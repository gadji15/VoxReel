'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { SceneDetailEditor } from '@/components/screens/StoryboardScreens'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/**
 * Create · per-scene editor (route: `/app/create/scene/[sceneId]`).
 *
 * The active scene id comes from the route param. `projectId` is preserved so
 * the draft stays hydrated when returning to the storyboard.
 */
export default function CreateScenePage() {
  const router = useRouter()
  const params = useParams<{ sceneId: string }>()
  const projectId = useSearchParams().get('projectId')
  const sceneId = Number(params?.sceneId)
  const storyboard = withProjectId(ROUTES.STORYBOARD, projectId)

  return (
    <SceneDetailEditor
      sceneId={Number.isNaN(sceneId) ? undefined : sceneId}
      onBack={() => router.push(storyboard)}
      onNext={() => router.push(storyboard)}
    />
  )
}
