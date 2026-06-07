import { SettingsConnected } from '@/components/app/SettingsConnected'
import { getCurrentUser } from '@/lib/supabase/auth'

// Reads the user session/cookies — must render per-request, never prerendered.
export const dynamic = 'force-dynamic'

/**
 * Settings (route: `/app/settings`). Server component — resolves the signed-in
 * user so the screen can show their real email / name.
 */
export default async function SettingsPage() {
  const user = await getCurrentUser()
  const fullName =
    typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : undefined

  return <SettingsConnected userEmail={user?.email} userName={fullName} />
}
