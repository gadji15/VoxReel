import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/health/auth-config
 *
 * Developer diagnostic for auth/env wiring. Helps explain "Invalid login
 * credentials": the most common cause is localhost and production pointing at
 * DIFFERENT Supabase projects (so the account exists in one but not the other).
 * Compare `projectRef` here on localhost vs. the deployed URL.
 *
 * Returns ONLY: the project ref (already public — it's in NEXT_PUBLIC_SUPABASE_URL),
 * booleans for whether each env var is present, reachability, and whether THIS
 * request has a session. NEVER returns secret values, never verifies passwords.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Extract the Supabase project ref from the public URL (`<ref>.supabase.co`). */
function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).host.split('.')[0] || null
  } catch {
    return null
  }
}

/** Ping GoTrue's public health endpoint to confirm the URL reaches a real project. */
async function pingSupabaseAuth(url: string | undefined): Promise<boolean> {
  if (!url) return false
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: anon ? { apikey: anon } : {},
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }
  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const reachable = await pingSupabaseAuth(process.env.NEXT_PUBLIC_SUPABASE_URL)

  // Whether THIS request is authenticated (no PII returned — just a boolean).
  let hasSession = false
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    hasSession = Boolean(user)
  } catch {
    /* ignore — reported via reachable */
  }

  const ok = env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && reachable
  return NextResponse.json(
    { ok, projectRef, env, reachable, hasSession, nodeEnv: process.env.NODE_ENV ?? 'unknown', timestamp },
    { status: ok ? 200 : 503 }
  )
}
