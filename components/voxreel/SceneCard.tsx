'use client'

import { Film, ChevronRight } from 'lucide-react'
import { EmotionBadge, IntensityBar, MatchScoreBadge } from './Badges'
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
        'w-full text-left rounded-2xl transition-all duration-200 overflow-hidden group active:scale-[0.985]',
        isActive ? 'border-[1.5px]' : 'border border-border hover:border-border/80'
      )}
      style={{
        backgroundColor: isActive ? 'rgba(196,60,60,0.04)' : '#0E0F14',
        borderColor: isActive ? 'rgba(196,60,60,0.4)' : undefined,
        boxShadow: isActive ? '0 0 0 1px rgba(196,60,60,0.06)' : 'none',
      }}
      aria-label={`Scene ${scene.index}: ${scene.emotion}`}
      aria-pressed={isActive}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div
          className="relative rounded-xl overflow-hidden shrink-0"
          style={{ width: 64, aspectRatio: '9/16', backgroundColor: '#08090D' }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(175deg, ${scene.emotionColor}18 0%, #060708 100%)` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-4 h-4 opacity-25 text-foreground" />
          </div>
          {/* Scene index */}
          <div className="absolute top-2 left-0 right-0 flex justify-center">
            <span className="text-[8px] font-bold text-white/40 tabular-nums">
              {String(scene.index).padStart(2, '0')}
            </span>
          </div>
          {/* Emotion strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: scene.emotionColor, opacity: 0.65 }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <EmotionBadge emotion={scene.emotion} color={scene.emotionColor} />
              <span className="text-[10px] tabular-nums" style={{ color: '#7A8394' }}>
                {scene.timeStart}–{scene.timeEnd}
              </span>
            </div>
            <ChevronRight
              className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isActive ? 'text-red-accent' : 'opacity-30 text-secondary-text')}
            />
          </div>

          {/* Quote */}
          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
            &ldquo;{scene.text}&rdquo;
          </p>

          {/* Intensity + match */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <IntensityBar value={scene.intensity} color={scene.emotionColor} />
            </div>
            <MatchScoreBadge score={scene.clipMatch} />
          </div>

          {/* Clip name */}
          <p className="text-[11px] truncate" style={{ color: '#7A8394' }}>{scene.clip}</p>
        </div>
      </div>
    </button>
  )
}
