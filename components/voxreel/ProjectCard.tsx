'use client'

import { Play, Clock, Layers, MoreVertical, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

const statusConfig = {
  complete:  { label: 'Published', color: '#C9A45A', bg: 'rgba(201,164,90,0.1)', border: 'rgba(201,164,90,0.2)' },
  rendering: { label: 'Rendering', color: '#6B4FE8', bg: 'rgba(107,79,232,0.1)', border: 'rgba(107,79,232,0.2)' },
  draft:     { label: 'Draft',     color: '#7A8394', bg: 'rgba(122,131,148,0.1)', border: 'rgba(122,131,148,0.15)' },
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.985] group"
      style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
      aria-label={`Open project: ${project.title}`}
    >
      {/* Thumbnail strip — cinematic widescreen */}
      <div
        className="relative"
        style={{ aspectRatio: '16/6', backgroundColor: '#08090D' }}
      >
        {/* Cinematic gradient wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              project.platform === 'tiktok'
                ? 'linear-gradient(135deg, #100A0A 0%, #0C0E18 100%)'
                : project.platform === 'instagram'
                ? 'linear-gradient(135deg, #0F0A14 0%, #0A0F18 100%)'
                : 'linear-gradient(135deg, #0A1210 0%, #0C0A16 100%)',
          }}
          aria-hidden="true"
        />

        {/* Waveform — only if published */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end gap-[2px] px-4 pb-2"
          style={{ height: '60%' }}
          aria-hidden="true"
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full flex-1"
              style={{
                height: `${(Math.sin(i * 0.65) * 0.38 + 0.5) * 100}%`,
                backgroundColor: project.status === 'complete' ? '#C43C3C' : '#1C2029',
                opacity: project.status === 'complete' ? 0.55 : 0.35,
              }}
            />
          ))}
        </div>

        {/* Fade from above */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{ background: 'linear-gradient(180deg, rgba(14,15,20,0.7) 0%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(196,60,60,0.88)', boxShadow: '0 0 20px rgba(196,60,60,0.5)' }}
          >
            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }}
          >
            {status.label}
          </span>
        </div>

        {/* Duration */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" style={{ color: '#7A8394' }} />
          <span className="text-[10px] font-medium" style={{ color: '#7A8394' }}>{project.duration}</span>
        </div>

        {/* Rendering progress */}
        {project.status === 'rendering' && (
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: '#1C2029' }}>
            <div className="h-full" style={{ width: '67%', backgroundColor: '#6B4FE8' }} />
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{project.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-2.5 h-2.5" style={{ color: '#7A8394' }} />
                <span className="text-[11px]" style={{ color: '#7A8394' }}>{project.scenes} scenes</span>
              </div>
              <span className="text-[11px]" style={{ color: '#7A8394' }}>{project.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {project.views && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: '#C9A45A' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#C9A45A' }}>{project.views}</span>
              </div>
            )}
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" style={{ color: '#7A8394' }} />
            </button>
          </div>
        </div>
      </div>
    </button>
  )
}
