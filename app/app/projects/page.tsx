import { ProjectsConnected } from '@/components/app/ProjectsConnected'
import { getCurrentUserProjects } from '@/lib/services/projects.service'
import { mapProjectRowsToUi } from '@/lib/mappers/project.mapper'

// Reads the user session/cookies — must render per-request, never prerendered.
export const dynamic = 'force-dynamic'

/**
 * Projects library (route: `/app/projects`). Server component — fetches the
 * current user's projects from Supabase, then hands them to a client connector.
 */
export default async function ProjectsPage() {
  const rows = await getCurrentUserProjects()
  const projects = mapProjectRowsToUi(rows)
  return <ProjectsConnected projects={projects} />
}
