import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseBrowserEnv } from '@/lib/supabase/env'

/**
 * VoxReel — Supabase auth middleware
 *
 * Responsibilities:
 *  - Refresh the Supabase session cookie on every matched request.
 *  - Protect `/app` and `/app/*` (redirect signed-out users to /login?next=…).
 *  - Bounce signed-in users away from /login and /signup to /app.
 *
 * Uses only the public URL + anon key (never the service role key).
 *
 * Public (no auth required): `/`, `/login`, `/signup`, `/auth/callback`,
 * `/api/health/supabase`. Only `/app` and `/app/*` are protected, so every
 * other path passes through automatically.
 */

export async function middleware(request: NextRequest) {
  const { url, anonKey } = getSupabaseBrowserEnv()

  // Start with a pass-through response we can attach refreshed cookies to.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  const isAppRoute = pathname === '/app' || pathname.startsWith('/app/')

  // Protect the app: signed-out users → /login (preserve destination).
  if (isAppRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // Signed-in users shouldn't see the auth pages.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const appUrl = request.nextUrl.clone()
    appUrl.pathname = '/app'
    appUrl.search = ''
    return NextResponse.redirect(appUrl)
  }

  // Everything else (incl. public paths) passes through with refreshed cookies.
  return response
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?)$).*)',
  ],
}
