'use client'

import { useRouter } from 'next/navigation'
import { RenderProgressScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/** Create · render progress (route: `/app/create/rendering`). */
export default function CreateRenderingPage() {
  const router = useRouter()
  return (
    <RenderProgressScreen
      onComplete={() => router.push(ROUTES.EXPORT)}
      onBack={() => router.push(ROUTES.PREVIEW)}
    />
  )
}
