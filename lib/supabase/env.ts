/**
 * VoxReel — Supabase environment helpers
 *
 * Centralized, validated access to Supabase env vars. Throws a clear error when
 * a required variable is missing. NEVER logs or returns secrets via error text.
 *
 * Safety:
 *  - `NEXT_PUBLIC_*` values are safe in the browser.
 *  - `SUPABASE_SERVICE_ROLE_KEY` is server-only and must NEVER reach the client.
 *    `getSupabaseAdminEnv()` is intentionally not exported to browser bundles —
 *    only import it from server-only modules (see `admin.ts`).
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    // Note: we intentionally include only the variable NAME, never its value.
    throw new Error(
      `[VoxReel] Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example).`
    )
  }
  return value
}

/** Public URL + anon key — safe to use in the browser. */
export function getSupabaseBrowserEnv(): { url: string; anonKey: string } {
  return {
    url: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  }
}

/**
 * Server-side, session-aware env. Uses the same public URL + anon key as the
 * browser (the anon key is the correct key for user-session clients; RLS does
 * the protecting). Kept separate so server code has its own clear entry point.
 */
export function getSupabaseServerEnv(): { url: string; anonKey: string } {
  return getSupabaseBrowserEnv()
}

/**
 * Admin env — URL + SERVICE ROLE key. SERVER-ONLY.
 * The service role key bypasses Row Level Security, so it must never be exposed
 * to the browser. Only call this from server-only modules.
 */
export function getSupabaseAdminEnv(): { url: string; serviceRoleKey: string } {
  return {
    url: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKey: required(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  }
}

/**
 * OpenAI API key — SERVER-ONLY. It is NOT a `NEXT_PUBLIC_*` var, so it is never
 * sent to the browser. Only call this from server-only modules (see
 * `lib/openai/client.ts`). The error includes the variable name, never its value.
 */
export function getOpenAIEnv(): { apiKey: string } {
  return {
    apiKey: required('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
  }
}
