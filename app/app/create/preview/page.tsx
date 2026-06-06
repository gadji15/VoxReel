'use client'

import { useRouter } from 'next/navigation'
import { PreviewScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/** Create · 9:16 preview (route: `/app/create/preview`). */
export default function CreatePreviewPage() {
  const router = useRouter()
  return (
    <PreviewScreen
      onRender={() => router.push(ROUTES.RENDERING)}
      onBack={() => router.push(ROUTES.STORYBOARD)}
    />
  )
}
