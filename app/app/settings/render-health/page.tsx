import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getRenderWorkerHealthSummary } from '@/lib/services/render-monitoring.service'
import { formatRelativeTime } from '@/lib/mappers/project.mapper'
import { ROUTES } from '@/lib/routes'

/**
 * Developer diagnostics: render queue + worker health (route:
 * `/app/settings/render-health`). Auth-protected by middleware. Shows only
 * aggregate counts (no other users' content) + the signed-in user's own recent
 * render jobs. No secrets are rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Render health — VoxReel' }

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}>
      <span className="text-2xl font-bold tabular-nums" style={{ color: accent ?? '#F0EDE6' }}>{value}</span>
      <span className="text-[11px] text-secondary-text">{label}</span>
    </div>
  )
}

export default async function RenderHealthPage() {
  const health = await getRenderWorkerHealthSummary()
  const { stats } = health

  // The signed-in user's own recent render jobs (session-scoped — never others').
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let myJobs: Array<{
    id: string
    status: string
    progress: number
    current_step: string | null
    created_at: string
  }> = []
  if (user) {
    const { data } = await supabase
      .from('render_jobs')
      .select('id, status, progress, current_step, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
    myJobs = data ?? []
  }

  const statusColor: Record<string, string> = {
    queued: '#9CA3AF',
    processing: '#6B4FE8',
    completed: '#C9A45A',
    failed: '#D64545',
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Developer diagnostics</p>
          <h1 className="text-xl font-bold text-foreground">Render Health</h1>
        </div>
        <Link
          href={ROUTES.SETTINGS}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-secondary-text hover:text-foreground hover:bg-muted transition-colors"
        >
          ← Settings
        </Link>
      </div>

      {/* Health banner */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={
          health.healthy
            ? { backgroundColor: 'rgba(201,164,90,0.08)', border: '1px solid rgba(201,164,90,0.25)' }
            : { backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.3)' }
        }
        role="status"
      >
        <span
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: health.healthy ? '#C9A45A' : '#D64545' }}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {health.healthy ? 'Render queue healthy' : 'Render queue needs attention'}
          </p>
          <p className="text-xs text-secondary-text mt-0.5">{health.message}</p>
        </div>
      </div>

      {/* Queue stats */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text mb-2">Queue</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Queued" value={stats.queued} accent="#9CA3AF" />
          <StatCard label="Processing" value={stats.processing} accent="#6B4FE8" />
          <StatCard label="Stale processing" value={stats.staleProcessing} accent={stats.staleProcessing > 0 ? '#D64545' : '#F0EDE6'} />
          <StatCard label="Completed (24h)" value={stats.completedRecent} accent="#C9A45A" />
          <StatCard label="Failed (24h)" value={stats.failedRecent} accent={stats.failedRecent > 0 ? '#D64545' : '#F0EDE6'} />
          <StatCard
            label="Oldest queued"
            value={stats.oldestQueuedAgeSeconds == null ? '—' : `${stats.oldestQueuedAgeSeconds}s`}
          />
        </div>
      </div>

      {/* FFmpeg / environment (this host) */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">FFmpeg (this host)</p>
          <p className="text-xs text-secondary-text mt-0.5">
            Environment: {health.environment} · stale after {health.staleAfterSeconds}s
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={
            health.ffmpegAvailable
              ? { backgroundColor: 'rgba(201,164,90,0.12)', color: '#C9A45A', border: '1px solid rgba(201,164,90,0.3)' }
              : { backgroundColor: 'rgba(214,69,69,0.12)', color: '#D64545', border: '1px solid rgba(214,69,69,0.3)' }
          }
        >
          {health.ffmpegAvailable ? 'Available' : 'Not available'}
        </span>
      </div>

      {/* Your recent renders (session-scoped) */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text mb-2">Your recent renders</p>
        <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: '#0E0F14' }}>
          {(myJobs ?? []).length === 0 ? (
            <p className="text-sm text-secondary-text p-4">No render jobs yet.</p>
          ) : (
            (myJobs ?? []).map((job, i) => (
              <div
                key={job.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : '1px solid #1C2029' }}
              >
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color: statusColor[job.status] ?? '#9CA3AF',
                    backgroundColor: `${statusColor[job.status] ?? '#9CA3AF'}1A`,
                    border: `1px solid ${statusColor[job.status] ?? '#9CA3AF'}40`,
                  }}
                >
                  {job.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{job.current_step ?? '—'}</p>
                  <p className="text-[10px] text-secondary-text">{formatRelativeTime(job.created_at)}</p>
                </div>
                <span className="text-xs tabular-nums text-secondary-text shrink-0">{job.progress}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-[11px] text-secondary-text">
        Aggregate counts are queue-wide; the job list shows only your own renders. Live JSON:{' '}
        <code className="text-foreground">/api/health/render-queue</code> ·{' '}
        <code className="text-foreground">/api/health/render</code>
      </p>
    </div>
  )
}
