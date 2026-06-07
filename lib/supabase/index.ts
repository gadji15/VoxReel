/**
 * VoxReel — Supabase client layer (safe public surface)
 *
 * Exposes only the browser and session-aware server clients, plus the Database
 * types. The ADMIN (service-role) client is deliberately NOT re-exported here —
 * import it directly from `@/lib/supabase/admin` (server-only) so it can never
 * be accidentally pulled into a client bundle through this barrel.
 */

export { createSupabaseBrowserClient } from './browser'
export { createSupabaseServerClient } from './server'
export type { Database, Json } from './database.types'
