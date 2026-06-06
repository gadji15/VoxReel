'use client'

import { useRouter } from 'next/navigation'
import { HomeDashboard } from '@/components/screens/HomeDashboard'
import { ROUTES } from '@/lib/routes'

/** App home / dashboard (route: `/app`). */
export default function AppHomePage() {
  const router = useRouter()
  return (
    <HomeDashboard
      onCreateReel={() => router.push(ROUTES.CREATE_UPLOAD)}
      onOpenProject={() => router.push(ROUTES.STORYBOARD)}
    />
  )
}
