/**
 * VoxReel — Supabase server client (session-aware)
 *
 * For Server Components, Route Handlers, and Server Actions. Reads/writes the
 * Supabase auth cookies via `next/headers` so the client acts as the signed-in
 * user (RLS applies). Uses the public URL + anon key — NOT the service role key.
 *
 * `cookies()` is async in Next.js (App Router), so this factory is async.
 *
 * NOTE: The app is still mock-driven; this client is wired up but not yet used.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseServerEnv } from './env'
import type { Database } from './database.types'

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseServerEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. This is safe to ignore when session refresh is handled
          // by middleware (not added yet — there's no auth flow at this stage).
        }
      },
    },
  })
}
