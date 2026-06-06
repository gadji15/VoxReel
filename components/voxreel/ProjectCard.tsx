'use client'

import { Play, Clock, Layers, Eye, MoreVertical, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  title: string
  duration: string
  scenes: number
  status: 'complete' | 'rendering' | 'draft'
  createdAt: string
  platform: string
  views: string | null
}

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

const statusConfig = {
  complete: { label: 'Published', color: '#D6B36A', bg: 'rgba(214,179,106,0.12)' },
  rendering: { label: 'Rendering', color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  draft: { label: 'Draft', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
}

const platformColors: Record<string, string> = {
  tiktok: '#F4F1EA',
  instagram: '#D64545',
  youtube: '#D64545',
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:border-border/80 active:scale-[0.98] group"
      style={{ backgroundColor: '#111318' }}
      aria-label={`Open project: ${project.title}`}
    >
      {/* Thumbnail area — cinematic 9:16 strip */}
      <div className="relative" style={{ aspectRatio: '16/7', backgroundColor: '#0C0D11' }}>
        {/* Cinematic color wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              project.platform === 'tiktok'
                ? 'linear-gradient(135deg, #150C0C 0%, #0D0E1A 100%)'
                : project.platform === 'instagram'
                ? 'linear-gradient(135deg, #120B16 0%, #0C1218 100%)'
                : 'linear-gradient(135deg, #0C1510 0%, #100C15 100%)',
          }}
          aria-hidden="true"
        />

        {/* Waveform hint */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-[2px]" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 2.5,
                height: `${(Math.sin(i * 0.7) * 0.4 + 0.5) * 20 + 4}px`,
                backgroundColor: project.status === 'complete' ? '#D64545' : '#252A33',
                opacity: project.status === 'complete' ? 0.7 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(214,69,69,0.9)' }}
          >
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>

        {/* Duration */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-secondary-text" />
          <span className="text-[10px] text-secondary-text font-medium">{project.duration}</span>
        </div>

        {/* Rendering progress bar */}
        {project.status === 'rendering' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
            <div
              className="h-full rounded-full"
              style={{ width: '67%', backgroundColor: '#7C5CFF' }}
            />
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate text-balance">{project.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-secondary-text" />
                <span className="text-[11px] text-secondary-text">{project.scenes} scenes</span>
              </div>
              <span className="text-[11px] text-secondary-text">{project.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {project.views && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: '#D6B36A' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#D6B36A' }}>{project.views}</span>
              </div>
            )}
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-border transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreVertical className="w-3.5 h-3.5 text-secondary-text" />
            </button>
          </div>
        </div>
      </div>
    </button>
  )
}
