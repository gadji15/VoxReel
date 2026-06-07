import 'server-only'

/**
 * VoxReel — server-side auth helpers
 *
 * Small conveniences around the session-aware server client. SERVER-ONLY
 * (`import 'server-only'`) — they read auth cookies via `next/headers` and must
 * not be used in client components.
 *
 * NOTE: route protection is primarily enforced by `middleware.ts`. `requireUser`
 * is a belt-and-suspenders helper for server components / actions.
 */

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './server'

/** Returns the signed-in user, or `null` if there is no valid session. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Returns the signed-in user, or redirects to `/login` if there is none.
 * Use in server components/actions that must have an authenticated user.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
