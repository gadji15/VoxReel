/**
 * VoxReel — create-flow URL helpers
 *
 * Keep the real `?projectId=<uuid>` query param attached as the user moves
 * through the create flow (upload → style → … → export, plus the scene editor),
 * so refresh / deep-link / hydration keep working.
 */

/** Append `?projectId=…` (or `&projectId=…`) to a path when an id is present. */
export function withProjectId(path: string, projectId?: string | null): string {
  if (!projectId) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}projectId=${encodeURIComponent(projectId)}`
}

/** A real Supabase project id is a UUID; the mock draft uses a short id like `1`. */
export function isRealProjectId(id: string | null | undefined): id is string {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
