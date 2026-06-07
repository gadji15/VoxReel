'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { StoryboardScreen } from '@/components/screens/StoryboardScreens'
import { ROUTES, sceneRoute } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · storyboard overview (route: `/app/create/storyboard`). */
export default function CreateStoryboardPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <StoryboardScreen
      onSceneSelect={(id) => router.push(withProjectId(sceneRoute(id), projectId))}
      onNext={() => router.push(withProjectId(ROUTES.PREVIEW, projectId))}
      onBack={() => router.push(withProjectId(ROUTES.TRANSCRIPT, projectId))}
    />
  )
}
