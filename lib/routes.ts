/**
 * VoxReel — route constants
 *
 * Single source of truth for App Router paths. Use these instead of hardcoding
 * path strings so navigation stays consistent and refactor-safe.
 *
 * NOTE: `/app/*` routes are now **auth-protected** by `middleware.ts` (Supabase
 * session required). Their *content* is still mock-driven — there is no project
 * persistence yet.
 */

export const ROUTES = {
  /** Public landing page. */
  HOME: '/',

  /** Auth (public). */
  LOGIN: '/login',
  SIGNUP: '/signup',
  AUTH_CALLBACK: '/auth/callback',

  /** Authenticated-app home (dashboard). */
  APP: '/app',
  PROJECTS: '/app/projects',

  /** Create flow. `CREATE` redirects to `CREATE_UPLOAD`. */
  CREATE: '/app/create',
  CREATE_UPLOAD: '/app/create/upload',
  CREATE_STYLE: '/app/create/style',
  ANALYSIS: '/app/create/analysis',
  TRANSCRIPT: '/app/create/transcript',
  STORYBOARD: '/app/create/storyboard',
  PREVIEW: '/app/create/preview',
  RENDERING: '/app/create/rendering',
  EXPORT: '/app/create/export',

  SETTINGS: '/app/settings',
} as const

/** Build the scene-editor route for a given scene id. */
export const sceneRoute = (sceneId: number | string) =>
  `/app/create/scene/${sceneId}` as const

export type RouteValue = (typeof ROUTES)[keyof typeof ROUTES]
