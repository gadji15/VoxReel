'use client'

import { useRouter } from 'next/navigation'
import { SettingsScreen } from '@/components/screens/FinalScreens'
import { ROUTES } from '@/lib/routes'

/** Settings (route: `/app/settings`). */
export default function SettingsPage() {
  const router = useRouter()
  return <SettingsScreen onBack={() => router.push(ROUTES.APP)} />
}
