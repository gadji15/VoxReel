'use client'

import { useRouter } from 'next/navigation'
import { ProjectsScreen } from '@/components/screens/ProjectsScreen'
import { ROUTES } from '@/lib/routes'

/** Projects library (route: `/app/projects`). */
export default function ProjectsPage() {
  const router = useRouter()
  return (
    <ProjectsScreen
      onCreateReel={() => router.push(ROUTES.CREATE_UPLOAD)}
      onOpenProject={() => router.push(ROUTES.STORYBOARD)}
    />
  )
}
