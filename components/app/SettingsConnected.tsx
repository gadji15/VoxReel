'use client'

import { useRouter } from 'next/navigation'
import { SettingsScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/**
 * Client connector for Settings — supplies the back navigation and the
 * authenticated user's display fields (resolved server-side).
 */
export function SettingsConnected({
  userEmail,
  userName,
}: {
  userEmail?: string
  userName?: string
}) {
  const router = useRouter()
  return (
    <SettingsScreen
      onBack={() => router.push(ROUTES.APP)}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
