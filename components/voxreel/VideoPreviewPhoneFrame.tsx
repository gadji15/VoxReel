'use client'

import { Play, Volume2, Maximize2 } from 'lucide-react'
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
    emotionColor: '#D64545',
    text: "She found the phone he swore didn't exist.",
    visualIntent: 'Dark car interior, phone glow, night tension.',
  }

  return (
    <div
      className="relative mx-auto"
      style={{
        width: compact ? 140 : 200,
        maxWidth: '100%',
      }}
      aria-label="Vertical video preview"
    >
      {/* Phone frame */}
      <div
        className="relative rounded-[28px] overflow-hidden"
        style={{
          aspectRatio: '9/16',
          border: '2px solid #252A33',
          boxShadow: compact ? 'none' : '0 0 40px rgba(214,69,69,0.15), 0 20px 60px rgba(0,0,0,0.6)',
          background: '#0A0B0E',
        }}
      >
        {/* Video content mock */}
        <div className="absolute inset-0">
          {/* Dark cinematic scene bg */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, #0D0E15 0%, #1A0A0A 60%, #0A0810 100%)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Subtle grain texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />

          {/* Emotion badge top left */}
          <div className="absolute top-4 left-3 z-10">
            <span
              className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${s.emotionColor}20`, color: s.emotionColor, border: `1px solid ${s.emotionColor}40` }}
            >
              {s.emotion}
            </span>
          </div>

          {/* VoxReel watermark top right */}
          <div className="absolute top-3.5 right-3 z-10">
            <span className="text-[7px] font-bold text-white/30 tracking-wider">VOXREEL</span>
          </div>

          {/* Center play */}
          {!isPlaying && (
            <button
              className="absolute inset-0 flex items-center justify-center z-10"
              onClick={() => setIsPlaying(true)}
              aria-label="Play preview"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(214,69,69,0.9)', boxShadow: '0 0 20px rgba(214,69,69,0.5)' }}
              >
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </button>
          )}

          {/* Caption text at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-5">
            <div
              className="text-white font-bold leading-snug mb-2"
              style={{ fontSize: compact ? '7px' : '10px', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
            >
              {s.text}
            </div>

            {/* Progress bar */}
            <div className="h-[2px] rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: '42%', backgroundColor: '#D64545' }}
              />
            </div>
          </div>

          {/* Volume icon */}
          <div className="absolute bottom-8 right-3 z-10">
            <Volume2 className="w-3 h-3 text-white/40" />
          </div>
        </div>
      </div>

      {/* Platform labels */}
      {!compact && (
        <div className="flex items-center justify-center gap-3 mt-3">
          {['TikTok', 'Reels', 'Shorts'].map((p) => (
            <span key={p} className="text-[10px] text-secondary-text font-medium">{p}</span>
          ))}
        </div>
      )}
    </div>
  )
}
