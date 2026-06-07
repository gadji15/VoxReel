import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback
 *
 * Handles the Supabase email-confirmation / OAuth redirect: exchanges the
 * `code` for a session (which sets the auth cookies), then redirects into the
 * app. On failure, redirects to /login with a generic error flag (no details
 * leaked).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/app') ? nextParam : '/app'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Missing code or exchange failed — send back to login with a generic flag.
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
