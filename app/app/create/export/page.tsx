'use client'

import { useRouter } from 'next/navigation'
import { ExportSuccessScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/**
 * Create · export success (route: `/app/create/export`).
 *
 * "New Reel" intentionally drops the projectId to start a fresh draft.
 */
export default function CreateExportPage() {
  const router = useRouter()
  return (
    <ExportSuccessScreen
      onNewReel={() => router.push(ROUTES.CREATE_UPLOAD)}
      onHome={() => router.push(ROUTES.APP)}
    />
  )
}
