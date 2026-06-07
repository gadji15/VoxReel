'use client'

import { useRouter } from 'next/navigation'
import { ProjectsScreen } from '@/components/screens/ProjectsScreen'
import { createNewProjectAction } from '@/app/app/projects/actions'
import { ROUTES } from '@/lib/routes'
import type { Project } from '@/lib/types'

/**
 * Client connector for the projects library. Real projects come from the server
 * page; "New Reel" creates a real row via the server action; opening a project
 * carries its `projectId` into the (still mock) create flow.
 */
export function ProjectsConnected({ projects }: { projects: Project[] }) {
  const router = useRouter()
  return (
    <ProjectsScreen
      projects={projects}
      onCreateReel={() => {
        void createNewProjectAction()
      }}
      onOpenProject={(id) => router.push(`${ROUTES.STORYBOARD}?projectId=${id}`)}
    />
  )
}
