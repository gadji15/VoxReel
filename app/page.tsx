'use client'

import { useRouter } from 'next/navigation'
import { LandingPage } from '@/components/screens/LandingPage'
import { ROUTES } from '@/lib/routes'

/**
 * Public landing page (route: `/`).
 *
 * "Get Started" navigates into the frontend-only app at `/app` instead of
 * mutating a local `view` state machine (which has been replaced by the App
 * Router structure under `app/app/*`).
 */
export default function HomePage() {
  const router = useRouter()
  return <LandingPage onGetStarted={() => router.push(ROUTES.APP)} />
}
