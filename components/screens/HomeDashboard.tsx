'use client'

import { Mic, TrendingUp, Zap, Play, ChevronRight, Bell } from 'lucide-react'
import { ProjectCard } from '@/components/voxreel/ProjectCard'
import { StaticWaveform } from '@/components/voxreel/AudioWaveform'
import { mockProjects } from '@/lib/mock-data'

interface HomeDashboardProps {
  onCreateReel: () => void
  onOpenProject: (id: string) => void
}

const stats = [
  { label: 'Total Views', value: '231K', delta: '+12%', color: '#D6B36A' },
  { label: 'Reels Made', value: '24', delta: '+3 this week', color: '#7C5CFF' },
  { label: 'Avg Match', value: '91%', delta: 'AI accuracy', color: '#D64545' },
]

export function HomeDashboard({ onCreateReel, onOpenProject }: HomeDashboardProps) {
  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-text font-medium">Good evening,</p>
          <h1 className="text-2xl font-bold text-foreground">Alex Moreno</h1>
        </div>
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-secondary-text" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-accent" aria-label="2 unread notifications" />
        </button>
      </div>

      {/* Hero Create CTA */}
      <button
        onClick={onCreateReel}
        className="relative w-full rounded-2xl overflow-hidden p-6 text-left transition-all hover:opacity-95 active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #1A0A0A 0%, #110A1A 100%)',
          border: '1px solid rgba(214,69,69,0.25)',
          boxShadow: '0 0 40px rgba(214,69,69,0.08)',
        }}
        aria-label="Record a new reel"
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(244,241,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,241,234,1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-accent animate-pulse" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest text-red-accent">Ready to Record</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1 text-balance">Create your next reel</h2>
            <p className="text-sm text-secondary-text">Speak. VoxReel handles the rest.</p>
          </div>

          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #D64545, #B03030)', boxShadow: '0 0 20px rgba(214,69,69,0.5)' }}
            aria-hidden="true"
          >
            <Mic className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Waveform */}
        <div className="relative mt-4">
          <StaticWaveform segments={44} />
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border p-4 flex flex-col gap-1"
            style={{ backgroundColor: '#111318' }}
          >
            <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-semibold text-secondary-text leading-tight">{s.label}</span>
            <span className="text-[10px] text-secondary-text">{s.delta}</span>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Recent Projects</h2>
          <button className="flex items-center gap-1 text-xs text-secondary-text hover:text-foreground transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {mockProjects.slice(0, 3).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onOpenProject(project.id)}
            />
          ))}
        </div>
      </div>

      {/* Trending Styles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Trending Styles</h2>
          <TrendingUp className="w-4 h-4 text-secondary-text" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" role="list">
          {[
            { name: 'Noir Cinéma', views: '2.1M', color: '#7C5CFF' },
            { name: 'Red Rage', views: '1.8M', color: '#D64545' },
            { name: 'Golden Hour', views: '1.4M', color: '#D6B36A' },
            { name: 'Ghost Signal', views: '980K', color: '#9CA3AF' },
          ].map((style) => (
            <div
              key={style.name}
              className="flex-shrink-0 rounded-xl border border-border px-4 py-3 flex flex-col gap-2"
              style={{ backgroundColor: '#111318', minWidth: 130 }}
              role="listitem"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${style.color}18`, border: `1px solid ${style.color}30` }}
                aria-hidden="true"
              >
                <Play className="w-3.5 h-3.5" style={{ color: style.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{style.name}</p>
                <p className="text-[10px] text-secondary-text">{style.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade nudge */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(214,179,106,0.07) 0%, rgba(124,92,255,0.07) 100%)', border: '1px solid rgba(214,179,106,0.18)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(214,179,106,0.15)', border: '1px solid rgba(214,179,106,0.3)' }}
            aria-hidden="true"
          >
            <Zap className="w-4.5 h-4.5" style={{ color: '#D6B36A' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Upgrade to Studio</p>
            <p className="text-xs text-secondary-text">Unlimited reels, 4K, API access</p>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all hover:opacity-90"
          style={{ backgroundColor: '#D6B36A', color: '#07080A' }}
        >
          Upgrade
        </button>
      </div>
    </div>
  )
}
