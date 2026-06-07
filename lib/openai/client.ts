import 'server-only'

/**
 * VoxReel — OpenAI client (SERVER-ONLY)
 *
 * ⚠️ Uses `OPENAI_API_KEY`. This module must NEVER be imported by a Client
 * Component — `import 'server-only'` makes the build fail if it ever is. Only
 * call `createOpenAIClient()` from server-only code (services, route handlers,
 * server actions).
 */

import OpenAI from 'openai'
import { getOpenAIEnv } from '@/lib/supabase/env'

export function createOpenAIClient(): OpenAI {
  const { apiKey } = getOpenAIEnv()
  return new OpenAI({ apiKey })
}
