'use client'

import { useRouter } from 'next/navigation'
import { AudioUploadScreen } from '@/components/screens/CreateFlow'
import { ROUTES } from '@/lib/routes'

/** Create · Step 1 — audio upload/record (route: `/app/create/upload`). */
export default function CreateUploadPage() {
  const router = useRouter()
  return (
    <AudioUploadScreen
      onNext={() => router.push(ROUTES.CREATE_STYLE)}
      onBack={() => router.push(ROUTES.APP)}
    />
  )
}
