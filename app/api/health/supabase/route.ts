import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/health/supabase
 *
 * Minimal, server-only diagnostic for the Supabase connection. It:
 *  - verifies the required env vars are present (via the env helpers),
 *  - runs a very light `select` against `profiles` (limit 1),
 *  - returns `{ ok, message, timestamp }`.
 *
 * Safety: never returns secrets or private rows (it requests `head: true`, so no
 * row data is returned — only whether the query succeeds). No auth required.
 */

// Always run on the server at request time (never statically prerendered).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    const supabase = createSupabaseAdminClient()

    // `head: true` + `count` performs a lightweight existence/reachability check
    // without returning any actual profile rows.
    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: `Supabase reachable, but query failed: ${error.message}`,
          timestamp,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { ok: true, message: 'Supabase connection healthy.', timestamp },
      { status: 200 }
    )
  } catch (err) {
    // Env-helper errors only contain variable NAMES (never values/secrets).
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, message, timestamp }, { status: 503 })
  }
}
