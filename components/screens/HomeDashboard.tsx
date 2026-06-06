'use client'

import { Mic, TrendingUp, Play, ChevronRight, Bell } from 'lucide-react'
import { ProjectCard } from '@/components/voxreel/ProjectCard'
import { StaticWaveform } from '@/components/voxreel/AudioWaveform'
import { mockProjects } from '@/lib/mock-data'

interface HomeDashboardProps {
  onCreateReel: () => void
  onOpenProject: (id: string) => void
}

const stats = [
  { label: 'Total Views', value: '231K', sub: '+12% this week', color: '#C9A45A' },
  { label: 'Reels Made', value: '24', sub: '+3 this week', color: '#6B4FE8' },
  { label: 'AI Accuracy', value: '91%', sub: 'Avg clip match', color: '#F0EDE6' },
]

export function HomeDashboard({ onCreateReel, onOpenProject }: HomeDashboardProps) {
  return (
    <div className="flex flex-col gap-8 pb-28 lg:pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium tracking-wide mb-1" style={{ color: '#7A8394' }}>Good evening</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Alex Moreno</h1>
        </div>
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: '#7A8394' }} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-accent" aria-label="Unread notifications" />
        </button>
      </div>

      {/* Hero Create CTA */}
      <button
        onClick={onCreateReel}
        className="relative w-full rounded-3xl overflow-hidden p-7 text-left transition-all hover:opacity-96 active:scale-[0.99] group"
        style={{
          backgroundColor: '#0E0F14',
          border: '1px solid #1C2029',
        }}
        aria-label="Record a new reel"
      >
        {/* Subtle top-right accent */}
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(196,60,60,0.07) 0%, transparent 65%)' }}
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-pulse" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#C43C3C' }}>Ready to Record</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1.5 tracking-tight">Create your next reel</h2>
              <p className="text-sm" style={{ color: '#7A8394' }}>Speak your story. VoxReel handles the rest.</p>
            </div>
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
              style={{ backgroundColor: '#C43C3C', boxShadow: '0 0 24px rgba(196,60,60,0.4)' }}
              aria-hidden="true"
            >
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
          <StaticWaveform segments={44} />
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
          >
            <span className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: s.color }}>{s.value}</span>
            <div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">{s.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#7A8394' }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground tracking-tight">Recent Projects</h2>
          <button className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: '#7A8394' }}>
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {mockProjects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => onOpenProject(project.id)} />
          ))}
        </div>
      </div>

      {/* Trending Styles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground tracking-tight">Trending</h2>
          <TrendingUp className="w-4 h-4" style={{ color: '#7A8394' }} />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" role="list">
          {[
            { name: 'Noir Cinéma', views: '2.1M', color: '#6B4FE8' },
            { name: 'Red Rage', views: '1.8M', color: '#C43C3C' },
            { name: 'Golden Hour', views: '1.4M', color: '#C9A45A' },
            { name: 'Ghost Signal', views: '980K', color: '#7A8394' },
          ].map((style) => (
            <div
              key={style.name}
              className="flex-shrink-0 rounded-2xl px-4 py-4 flex flex-col gap-3"
              style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029', minWidth: 130 }}
              role="listitem"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${style.color}16` }}
                aria-hidden="true"
              >
                <Play className="w-3 h-3" style={{ color: style.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{style.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#7A8394' }}>{style.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
