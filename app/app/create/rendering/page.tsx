'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RenderProgressScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · render progress (route: `/app/create/rendering`). */
export default function CreateRenderingPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <RenderProgressScreen
      onComplete={() => router.push(withProjectId(ROUTES.EXPORT, projectId))}
      onBack={() => router.push(withProjectId(ROUTES.PREVIEW, projectId))}
    />
  )
}
