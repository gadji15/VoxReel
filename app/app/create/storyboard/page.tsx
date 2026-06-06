'use client'

import { useRouter } from 'next/navigation'
import { StoryboardScreen } from '@/components/screens/StoryboardScreens'
import { ROUTES, sceneRoute } from '@/lib/routes'

/** Create · storyboard overview (route: `/app/create/storyboard`). */
export default function CreateStoryboardPage() {
  const router = useRouter()
  return (
    <StoryboardScreen
      onSceneSelect={(id) => router.push(sceneRoute(id))}
      onNext={() => router.push(ROUTES.PREVIEW)}
      onBack={() => router.push(ROUTES.TRANSCRIPT)}
    />
  )
}
