'use client'

/**
 * VoxReel — Supabase browser client
 *
 * For use in Client Components. Uses only the public URL + anon key. Row Level
 * Security (configured in the initial migration) is what protects data.
 *
 * NOTE: The app is still mock-driven; this client is wired up but not yet used
 * by the create flow.
 */

import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseBrowserEnv } from './env'
import type { Database } from './database.types'

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseBrowserEnv()
  return createBrowserClient<Database>(url, anonKey)
}
