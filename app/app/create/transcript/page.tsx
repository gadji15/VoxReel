'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { TranscriptReviewScreen } from '@/components/screens/AnalysisScreens'
import { ROUTES } from '@/lib/routes'
import { withProjectId } from '@/lib/navigation/create-flow-url'

/** Create · transcript review (route: `/app/create/transcript`). */
export default function CreateTranscriptPage() {
  const router = useRouter()
  const projectId = useSearchParams().get('projectId')
  return (
    <TranscriptReviewScreen
      onNext={() => router.push(withProjectId(ROUTES.STORYBOARD, projectId))}
      onBack={() => router.push(withProjectId(ROUTES.ANALYSIS, projectId))}
    />
  )
}
