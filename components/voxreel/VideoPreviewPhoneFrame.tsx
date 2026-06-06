'use client'

import { Play, Volume2 } from 'lucide-react'
import { useState } from 'react'

interface VideoPreviewPhoneFrameProps {
  scene?: {
    emotion: string
    emotionColor: string
    text: string
    visualIntent: string
  }
  compact?: boolean
}

export function VideoPreviewPhoneFrame({ scene, compact = false }: VideoPreviewPhoneFrameProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const s = scene ?? {
    emotion: 'Betrayal',
    emotionColor: '#C43C3C',
    text: "She found the phone he swore didn't exist.",
    visualIntent: 'Dark car interior, phone glow, night tension.',
  }

  const width = compact ? 130 : 220

  return (
    <div
      className="relative mx-auto"
      style={{ width, maxWidth: '100%' }}
      aria-label="Vertical video preview"
    >
      {/* Ambient glow beneath phone */}
      {!compact && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -24,
            left: '10%',
            right: '10%',
            height: 60,
            background: `radial-gradient(ellipse at center, ${s.emotionColor}28 0%, transparent 70%)`,
            filter: 'blur(18px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Phone frame */}
      <div
        className="relative rounded-[32px] overflow-hidden"
        style={{
          aspectRatio: '9/16',
          border: compact ? '1.5px solid #1C2029' : '2px solid #252A33',
          background: '#08090D',
          boxShadow: compact
            ? 'none'
            : `0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.9), 0 0 50px ${s.emotionColor}14`,
        }}
      >
        {/* Cinematic scene background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(195deg, ${s.emotionColor}14 0%, #090A10 45%, #060708 100%)`,
            }}
          />

          {/* Deep vignette */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(0,0,0,0.85) 100%)' }}
            aria-hidden="true"
          />

          {/* Subtle film grain */}
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />

          {/* Horizontal light streak */}
          {!compact && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: '38%',
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${s.emotionColor}18, transparent)`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Top bar — emotion + watermark */}
          <div className="absolute top-4 left-3 right-3 flex items-center justify-between z-10">
            <span
              className="font-bold uppercase tracking-widest rounded-full"
              style={{
                fontSize: compact ? 6 : 8,
                padding: compact ? '1px 6px' : '2px 8px',
                backgroundColor: `${s.emotionColor}20`,
                color: s.emotionColor,
                border: `1px solid ${s.emotionColor}35`,
              }}
            >
              {s.emotion}
            </span>
            <span
              className="font-bold tracking-widest text-white/25"
              style={{ fontSize: compact ? 6 : 8 }}
            >
              VOXREEL
            </span>
          </div>

          {/* Center play */}
          {!isPlaying && (
            <button
              className="absolute inset-0 flex items-center justify-center z-10"
              onClick={() => setIsPlaying(true)}
              aria-label="Play preview"
            >
              <div
                className="rounded-full flex items-center justify-center transition-transform hover:scale-105"
                style={{
                  width: compact ? 28 : 44,
                  height: compact ? 28 : 44,
                  backgroundColor: 'rgba(196,60,60,0.88)',
                  boxShadow: `0 0 ${compact ? 12 : 24}px rgba(196,60,60,0.55)`,
                }}
              >
                <Play
                  fill="white"
                  className="text-white"
                  style={{
                    width: compact ? 10 : 16,
                    height: compact ? 10 : 16,
                    marginLeft: compact ? 1 : 2,
                  }}
                />
              </div>
            </button>
          )}

          {/* Caption + progress */}
          <div className="absolute bottom-0 left-0 right-0 z-10" style={{ padding: compact ? '0 8px 10px' : '0 14px 16px' }}>
            {/* Caption */}
            <p
              className="text-white font-bold leading-snug mb-2.5 text-center"
              style={{
                fontSize: compact ? 7 : 11,
                textShadow: '0 2px 12px rgba(0,0,0,0.95)',
              }}
            >
              {s.text}
            </p>

            {/* Progress bar */}
            <div className="h-[1.5px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: '42%', backgroundColor: s.emotionColor }}
              />
            </div>

            {/* Time */}
            {!compact && (
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-medium text-white/30">0:20</span>
                <span className="text-[8px] font-medium text-white/30">0:47</span>
              </div>
            )}
          </div>

          {/* Volume */}
          {!compact && (
            <div className="absolute top-12 right-3 z-10">
              <Volume2 className="w-3 h-3 text-white/25" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
