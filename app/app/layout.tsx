import type { ReactNode } from 'react'
import { VoxReelAppShell } from '@/components/layout/VoxReelAppShell'

/**
 * Layout for the frontend-only "app" section. Every `/app/*` route is rendered
 * inside the shared shell (sidebar + bottom nav). No auth gate yet.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <VoxReelAppShell>{children}</VoxReelAppShell>
}
