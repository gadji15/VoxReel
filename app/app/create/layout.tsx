import { Suspense, type ReactNode } from 'react'
import { CreateFlowProvider } from '@/components/providers/CreateFlowProvider'
import { CreateFlowProjectBridge } from '@/components/providers/CreateFlowProjectBridge'

/**
 * Wraps the whole create flow (`/app/create/*`) in the CreateFlowProvider so
 * every step shares one typed draft project.
 *
 * The provider can be hydrated from a real Supabase project: the
 * `CreateFlowProjectBridge` reads `?projectId=…` (client) and loads that
 * project's draft. With no `projectId`, the flow stays mock-driven.
 *
 * The Suspense boundary is required because the bridge and the step pages read
 * `useSearchParams()`; it lets those pages keep their static shell.
 */
export default function CreateLayout({ children }: { children: ReactNode }) {
  return (
    <CreateFlowProvider>
      <Suspense fallback={null}>
        <CreateFlowProjectBridge />
        {children}
      </Suspense>
    </CreateFlowProvider>
  )
}
