'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AnalysisProgressScreen } from '@/components/screens/AnalysisScreens'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · analysis progress (route: `/app/create/analysis`). */
export default function CreateAnalysisPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <AnalysisProgressScreen
      onComplete={() => router.push(withProjectId(ROUTES.TRANSCRIPT, projectId))}
    />
  )
}
