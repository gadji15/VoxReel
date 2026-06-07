import { DashboardConnected } from '@/components/app/DashboardConnected'
import { getRecentProjects } from '@/lib/services/projects.service'
import { mapProjectRowsToUi } from '@/lib/mappers/project.mapper'

// Reads the user session/cookies — must render per-request, never prerendered.
export const dynamic = 'force-dynamic'

/**
 * App home / dashboard (route: `/app`). Server component — fetches the current
 * user's recent projects from Supabase, then hands them to a client connector.
 */
export default async function AppHomePage() {
  const rows = await getRecentProjects(3)
  const projects = mapProjectRowsToUi(rows)
  return <DashboardConnected projects={projects} />
}
