'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DesktopSidebar } from '@/components/voxreel/DesktopSidebar'
import { MobileBottomNav } from '@/components/voxreel/MobileBottomNav'
import { createNewProjectAction } from '@/app/app/projects/actions'
import { ROUTES } from '@/lib/routes'

/**
 * Shared shell for all `/app/*` routes: desktop sidebar + mobile bottom nav +
 * centered main content area. Active tab is derived from the current pathname,
 * and navigation is performed with the Next.js router.
 */

/**
 * Map a nav tab id to its destination route. NOTE: the "create" tab is handled
 * separately (it must create a REAL project, not just navigate) — see
 * `handleTabChange`.
 */
const tabToRoute: Record<string, string> = {
  home: ROUTES.APP,
  projects: ROUTES.PROJECTS,
  // "Library" maps to Projects for now (frontend-only).
  library: ROUTES.PROJECTS,
  settings: ROUTES.SETTINGS,
}

/** Derive the active nav tab from the current pathname. */
function getActiveTab(pathname: string): string {
  if (pathname.startsWith(ROUTES.SETTINGS)) return 'settings'
  if (pathname.startsWith(ROUTES.CREATE)) return 'create'
  if (pathname.startsWith(ROUTES.PROJECTS)) return 'projects'
  if (pathname === ROUTES.APP) return 'home'
  return 'home'
}

export function VoxReelAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const activeTab = getActiveTab(pathname)

  const handleTabChange = (tab: string) => {
    // The "create" tab (mobile plus button + desktop "New Reel") must use the
    // SAME canonical flow as every other create button: create a real Supabase
    // project, then the server action redirects to
    // /app/create/upload?projectId=<uuid>. Never navigate there without an id.
    if (tab === 'create') {
      void createNewProjectAction()
      return
    }
    const target = tabToRoute[tab]
    if (target) router.push(target)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <DesktopSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <main
          className="flex-1 min-w-0 px-4 pt-6 lg:pt-10 lg:px-10 lg:ml-56"
          role="main"
          aria-label="Main content"
        >
          <div className="max-w-xl mx-auto">{children}</div>
        </main>

        <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}
