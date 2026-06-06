'use client'

import { Film, Zap, ChevronRight, Play } from 'lucide-react'
import { EmotionBadge, MatchScoreBadge, IntensityBar } from './Badges'
import { cn } from '@/lib/utils'

interface Scene {
  id: number
  index: number
  total: number
  timeStart: string
  timeEnd: string
  emotion: string
  emotionColor: string
  intensity: number
  text: string
  visualIntent: string
  clip: string
  clipMatch: number
  motion: string
  transition: string
}

interface SceneCardProps {
  scene: Scene
  isActive?: boolean
  onClick?: () => void
}

export function SceneCard({ scene, isActive = false, onClick }: SceneCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden group active:scale-[0.98]',
        isActive ? 'border-red-accent' : 'border-border hover:border-border/60'
      )}
      style={{
        backgroundColor: isActive ? 'rgba(214,69,69,0.06)' : '#111318',
        boxShadow: isActive ? '0 0 20px rgba(214,69,69,0.1)' : 'none',
      }}
      aria-label={`Scene ${scene.index}: ${scene.emotion}`}
      aria-pressed={isActive}
    >
      <div className="flex gap-3 p-4">
        {/* Scene thumbnail mock */}
        <div
          className="relative rounded-xl overflow-hidden shrink-0"
          style={{ width: 72, aspectRatio: '9/16', backgroundColor: '#0A0B0E' }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${scene.emotionColor}22 0%, #080910 100%)`,
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Film className="w-4 h-4 text-secondary-text opacity-40" />
          </div>
          {/* Scene number */}
          <div className="absolute top-1.5 left-0 right-0 flex justify-center">
            <span className="text-[9px] font-bold text-white/50">
              {String(scene.index).padStart(2, '0')}
            </span>
          </div>
          {/* Emotion color strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: scene.emotionColor, opacity: 0.7 }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-secondary-text tracking-wide">
                SCENE {scene.index}/{scene.total}
              </span>
              <span className="text-[10px] text-secondary-text">
                {scene.timeStart} – {scene.timeEnd}
              </span>
            </div>
            <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isActive ? 'text-red-accent' : 'text-secondary-text')} />
          </div>

          {/* Emotion */}
          <EmotionBadge emotion={scene.emotion} color={scene.emotionColor} />

          {/* Text */}
          <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
            &ldquo;{scene.text}&rdquo;
          </p>

          {/* Intensity */}
          <IntensityBar value={scene.intensity} color={scene.emotionColor} />

          {/* Clip row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Play className="w-2.5 h-2.5 text-secondary-text shrink-0" />
              <span className="text-[11px] text-secondary-text truncate">{scene.clip}</span>
            </div>
            <MatchScoreBadge score={scene.clipMatch} />
          </div>

          {/* Motion / Transition */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md"
              style={{ backgroundColor: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)' }}
            >
              <Zap className="w-2.5 h-2.5" style={{ color: '#7C5CFF' }} />
              <span className="text-[10px] font-medium" style={{ color: '#7C5CFF' }}>{scene.motion}</span>
            </div>
            <span className="text-[10px] text-secondary-text">→ {scene.transition}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
