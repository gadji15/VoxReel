'use client'

import { useRouter } from 'next/navigation'
import { StyleSelectionScreen } from '@/components/screens/CreateFlow'
import { ROUTES } from '@/lib/routes'

/** Create · Step 2 — style selection (route: `/app/create/style`). */
export default function CreateStylePage() {
  const router = useRouter()
  return (
    <StyleSelectionScreen
      onNext={() => router.push(ROUTES.ANALYSIS)}
      onBack={() => router.push(ROUTES.CREATE_UPLOAD)}
    />
  )
}
