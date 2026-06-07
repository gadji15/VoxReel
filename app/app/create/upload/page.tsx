'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AudioUploadScreen } from '@/components/screens/CreateFlow'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · Step 1 — audio upload/record (route: `/app/create/upload`). */
export default function CreateUploadPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <AudioUploadScreen
      onNext={() => router.push(withProjectId(ROUTES.CREATE_STYLE, projectId))}
      onBack={() => router.push(ROUTES.APP)}
    />
  )
}
