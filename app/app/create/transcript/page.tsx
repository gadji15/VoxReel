'use client'

import { useRouter } from 'next/navigation'
import { TranscriptReviewScreen } from '@/components/screens/AnalysisScreens'
import { ROUTES } from '@/lib/routes'

/** Create · transcript review (route: `/app/create/transcript`). */
export default function CreateTranscriptPage() {
  const router = useRouter()
  return (
    <TranscriptReviewScreen
      onNext={() => router.push(ROUTES.STORYBOARD)}
      onBack={() => router.push(ROUTES.ANALYSIS)}
    />
  )
}
