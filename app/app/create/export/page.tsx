'use client'

import { useRouter } from 'next/navigation'
import { ExportSuccessScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/** Create · export success (route: `/app/create/export`). */
export default function CreateExportPage() {
  const router = useRouter()
  return (
    <ExportSuccessScreen
      onNewReel={() => router.push(ROUTES.CREATE_UPLOAD)}
      onHome={() => router.push(ROUTES.APP)}
    />
  )
}
