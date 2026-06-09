import 'server-only'

/**
 * VoxReel — render service (SERVER-ONLY, session/web side)
 *
 * Read-only helpers for the web/UI: fetch a project's latest export and build a
 * short-lived signed download URL. Job enqueue lives in `render-queue.service.ts`;
 * the heavy FFmpeg render runs in the worker (`render-worker.service.ts`).
 *
 * Uses the session-aware Supabase client (RLS) — never the admin/service role.
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import type { Database } from '@/lib/supabase/database.types'
import type { RenderExportMetadata } from '@/lib/render/types'
import { EXPORTS_BUCKET } from '@/lib/render/constants'

type ExportRow = Database['public']['Tables']['exports']['Row']
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

const SIGNED_URL_TTL = 60 * 60 // 1 hour

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  return { supabase, user }
}

async function signedUrlFor(supabase: ServerClient, storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(EXPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL)
  return data?.signedUrl ?? null
}

function toExportMetadata(row: ExportRow, downloadUrl: string | null): RenderExportMetadata {
  return {
    exportId: row.id,
    fileName: row.file_name ?? 'final.mp4',
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path ?? '',
    format: row.format,
    mimeType: row.mime_type,
    durationSeconds: Number(row.duration_seconds ?? 0),
    sizeBytes: Number(row.size_bytes ?? 0),
    width: row.resolution_width,
    height: row.resolution_height,
    fps: row.fps,
    createdAt: row.created_at,
    downloadUrl,
  }
}

/** The latest export for a project (+ a short-lived signed download URL). */
export async function getLatestExport(projectId: string): Promise<RenderExportMetadata | null> {
  const { supabase, user } = await getAuthedContext()
  const { data } = await supabase
    .from('exports')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const url = data.storage_path ? await signedUrlFor(supabase, data.storage_path) : null
  return toExportMetadata(data, url)
}
