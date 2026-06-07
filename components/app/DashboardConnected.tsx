'use client'

import { useRouter } from 'next/navigation'
import { HomeDashboard } from '@/components/screens/HomeDashboard'
import { createNewProjectAction } from '@/app/app/projects/actions'
import { ROUTES } from '@/lib/routes'
import type { Project } from '@/lib/types'

/**
 * Client connector for the dashboard: real projects come from the server page;
 * "create" calls the server action (which makes a real row + redirects), and
 * opening a project carries its `projectId` into the (still mock) create flow.
 */
export function DashboardConnected({ projects }: { projects: Project[] }) {
  const router = useRouter()
  return (
    <HomeDashboard
      projects={projects}
      onCreateReel={() => {
        void createNewProjectAction()
      }}
      onOpenProject={(id) => router.push(`${ROUTES.STORYBOARD}?projectId=${id}`)}
    />
  )
}
