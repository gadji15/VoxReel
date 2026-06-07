'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { StyleSelectionScreen } from '@/components/screens/CreateFlow'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · Step 2 — style selection (route: `/app/create/style`). */
export default function CreateStylePage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <StyleSelectionScreen
      onNext={() => router.push(withProjectId(ROUTES.ANALYSIS, projectId))}
      onBack={() => router.push(withProjectId(ROUTES.CREATE_UPLOAD, projectId))}
    />
  )
}
