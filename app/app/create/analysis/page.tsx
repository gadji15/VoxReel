'use client'

import { useRouter } from 'next/navigation'
import { AnalysisProgressScreen } from '@/components/screens/AnalysisScreens'
import { ROUTES } from '@/lib/routes'

/** Create · analysis progress (route: `/app/create/analysis`). */
export default function CreateAnalysisPage() {
  const router = useRouter()
  return <AnalysisProgressScreen onComplete={() => router.push(ROUTES.TRANSCRIPT)} />
}
