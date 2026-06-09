import { DashboardConnected } from '@/components/app/DashboardConnected'
import { getRecentProjects } from '@/lib/services/projects.service'
import { mapProjectRowsToUi } from '@/lib/mappers/project.mapper'
import { getCurrentUser } from '@/lib/supabase/auth'

// Reads the user session/cookies — must render per-request, never prerendered.
export const dynamic = 'force-dynamic'

/**
 * App home / dashboard (route: `/app`). Server component — fetches the current
 * user's recent projects from Supabase, then hands them to a client connector.
 */
export default async function AppHomePage() {
  const [rows, user] = await Promise.all([getRecentProjects(3), getCurrentUser()])
  const projects = mapProjectRowsToUi(rows)
  const fullName =
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined
  return <DashboardConnected projects={projects} userName={fullName} userEmail={user?.email} />
}
