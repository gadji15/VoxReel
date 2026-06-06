'use client'

import { useParams, useRouter } from 'next/navigation'
import { SceneDetailEditor } from '@/components/screens/StoryboardScreens'
import { ROUTES } from '@/lib/routes'

/**
 * Create · per-scene editor (route: `/app/create/scene/[sceneId]`).
 *
 * The active scene id comes from the route param (mock state). Falls back to
 * scene 4 — the editor's own default — if the param is missing/invalid.
 */
export default function CreateScenePage() {
  const router = useRouter()
  const params = useParams<{ sceneId: string }>()
  const sceneId = Number(params?.sceneId)

  return (
    <SceneDetailEditor
      sceneId={Number.isNaN(sceneId) ? undefined : sceneId}
      onBack={() => router.push(ROUTES.STORYBOARD)}
      onNext={() => router.push(ROUTES.STORYBOARD)}
    />
  )
}
