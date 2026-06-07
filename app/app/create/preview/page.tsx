'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PreviewScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · 9:16 preview (route: `/app/create/preview`). */
export default function CreatePreviewPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <PreviewScreen
      onRender={() => router.push(withProjectId(ROUTES.RENDERING, projectId))}
      onBack={() => router.push(withProjectId(ROUTES.STORYBOARD, projectId))}
    />
  )
}
