/**
 * VoxReel — shared render constants (no server-only guard)
 *
 * Plain constants usable by both the web (server actions / session services) and
 * the standalone render worker (run via tsx, where `server-only` would throw).
 */

/** Private bucket for finished MP4 exports. */
export const EXPORTS_BUCKET = 'video-exports'

/** Project status once a render has completed. */
export const STATUS_RENDERED = 'rendered'

/** Default worker poll interval (ms) when env is unset. */
export const DEFAULT_WORKER_POLL_MS = 5000
