import 'server-only'

/**
 * VoxReel — Supabase ADMIN client (service role). SERVER-ONLY.
 *
 * ⚠️  DANGER: This client uses `SUPABASE_SERVICE_ROLE_KEY`, which BYPASSES Row
 * Level Security and can read/write any row. It must NEVER be imported by a
 * Client Component or shipped to the browser.
 *
 * Guards in place:
 *  - `import 'server-only'` (above) makes the build FAIL if this module is ever
 *    pulled into a client bundle.
 *  - It is intentionally NOT re-exported from `lib/supabase/index.ts`. Import it
 *    directly (`import { createSupabaseAdminClient } from '@/lib/supabase/admin'`)
 *    and only from server-only code (Route Handlers, Server Actions, scripts).
 *
 * Use it sparingly — for trusted backend operations (e.g. health checks, jobs,
 * webhooks). Prefer the session-aware server client for normal user operations.
 */

import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminEnv } from './env'
import type { Database } from './database.types'

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv()
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
