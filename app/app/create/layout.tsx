import type { ReactNode } from 'react'
import { CreateFlowProvider } from '@/components/providers/CreateFlowProvider'

/**
 * Wraps the whole create flow (`/app/create/*`) in the CreateFlowProvider so
 * every step shares one typed draft project. Still frontend-only — no backend.
 */
export default function CreateLayout({ children }: { children: ReactNode }) {
  return <CreateFlowProvider>{children}</CreateFlowProvider>
}
