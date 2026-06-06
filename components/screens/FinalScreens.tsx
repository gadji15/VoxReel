'use client'

import { useEffect, useState } from 'react'
import {
  ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize2,
  Download, Share2, Instagram, Youtube, CheckCircle2,
  User, Bell, Shield, CreditCard, Mic, Film, Zap,
  ChevronRight, Moon, Globe, HelpCircle, LogOut, Star
} from 'lucide-react'
import { VideoPreviewPhoneFrame } from '@/components/voxreel/VideoPreviewPhoneFrame'
import { cn } from '@/lib/utils'

/* ── Vertical 9:16 Preview Screen ── */
interface PreviewScreenProps {
  onRender: () => void
  onBack: () => void
}

export function PreviewScreen({ onRender, onBack }: PreviewScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(32)

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setIsPlaying(false); return 0 }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(id)
  }, [isPlaying])

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Go back">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Midnight Betrayal</p>
          <h1 className="text-xl font-bold text-foreground">Preview</h1>
        </div>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
          aria-label="Fullscreen preview"
        >
          <Maximize2 className="w-4 h-4 text-secondary-text" />
        </button>
      </div>

      {/* Full preview phone — centered and immersive */}
      <div className="flex flex-col items-center gap-6 py-2">
        <div className="relative flex justify-center">
          {/* Ambient glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: -40,
              left: '5%',
              right: '5%',
              height: 80,
              background: 'radial-gradient(ellipse at center, rgba(196,60,60,0.2) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
            aria-hidden="true"
          />

          {/* Phone */}
          <div
            className="relative rounded-[40px] overflow-hidden"
            style={{
              aspectRatio: '9/16',
              width: 290,
              background: '#08090D',
              border: '2px solid #252A33',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.95), 0 0 60px rgba(196,60,60,0.12)',
            }}
            aria-label="9:16 video preview"
          >
            {/* Background */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(195deg, rgba(196,60,60,0.12) 0%, #090A10 45%, #060708 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, transparent 20%, rgba(0,0,0,0.85) 100%)' }} aria-hidden="true" />

            {/* Film grain */}
            <div
              className="absolute inset-0 opacity-[0.045] mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
              aria-hidden="true"
            />

            {/* Top bar */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
              <span className="text-[9px] font-bold text-white/25 tracking-widest">VOXREEL</span>
              <span
                className="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(196,60,60,0.18)', color: '#C43C3C', border: '1px solid rgba(196,60,60,0.3)' }}
              >
                Betrayal
              </span>
            </div>

            {/* Mute */}
            <button
              className="absolute top-14 right-5 z-10"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/30" /> : <Volume2 className="w-4 h-4 text-white/30" />}
            </button>

            {/* Play/pause */}
            <button
              className="absolute inset-0 flex items-center justify-center z-10"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {!isPlaying && (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(196,60,60,0.88)', boxShadow: '0 0 40px rgba(196,60,60,0.6)' }}
                >
                  <Play className="w-7 h-7 text-white ml-1" fill="white" />
                </div>
              )}
            </button>

            {/* Caption + progress */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-6">
              <p className="text-white font-bold text-[12px] leading-snug text-center mb-3" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.95)' }}>
                She found the phone he swore&nbsp;didn&rsquo;t exist.
              </p>
              <div className="h-[1.5px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#C43C3C' }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] font-medium text-white/30">0:{String(Math.floor(progress * 0.47)).padStart(2,'0')}</span>
                <span className="text-[9px] font-medium text-white/30">0:47</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform selector */}
        <div className="flex items-center gap-2" role="group" aria-label="Platform selection">
          {[
            { name: 'TikTok', active: true },
            { name: 'Reels', active: false },
            { name: 'Shorts', active: false },
          ].map((p) => (
            <button
              key={p.name}
              className="text-xs font-semibold px-4 py-2 rounded-full transition-all"
              style={p.active
                ? { backgroundColor: 'rgba(196,60,60,0.1)', border: '1px solid rgba(196,60,60,0.3)', color: '#C43C3C' }
                : { backgroundColor: '#0E0F14', border: '1px solid #1C2029', color: '#7A8394' }
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Scenes', value: '7' },
          { label: 'Duration', value: '0:47' },
          { label: 'Resolution', value: '4K' },
        ].map((d) => (
          <div key={d.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}>
            <p className="text-lg font-bold text-foreground">{d.value}</p>
            <p className="text-[10px] mt-1" style={{ color: '#7A8394' }}>{d.label}</p>
          </div>
        ))}
      </div>

      {/* Render CTA */}
      <button
        onClick={onRender}
        className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-92 active:scale-[0.98]"
        style={{ backgroundColor: '#C43C3C', boxShadow: '0 0 32px rgba(196,60,60,0.35)' }}
      >
        <Zap className="w-5 h-5" />
        Render Reel
      </button>
    </div>
  )
}

/* ── Render Progress Screen ── */
interface RenderProgressProps {
  onComplete: () => void
  onBack: () => void
}

export function RenderProgressScreen({ onComplete, onBack }: RenderProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  const [done, setDone] = useState(false)

  const stages = [
    'Compositing scenes...',
    'Rendering motion effects...',
    'Applying color grade...',
    'Adding captions...',
    'Encoding 4K output...',
    'Finalizing export...',
  ]

  useEffect(() => {
    const totalTime = 6000
    const start = Date.now()
    const id = setInterval(() => {
      const p = Math.min(((Date.now() - start) / totalTime) * 100, 100)
      setProgress(Math.round(p))
      setCurrentStage(Math.min(Math.floor(p / (100 / stages.length)), stages.length - 1))
      if (p >= 100) {
        clearInterval(id)
        setDone(true)
        setTimeout(onComplete, 1500)
      }
    }, 50)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 py-10">
      {/* Cinematic render animation */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: done
              ? 'radial-gradient(circle, rgba(214,179,106,0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124,92,255,0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
            transform: 'scale(2)',
          }}
          aria-hidden="true"
        />

        <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="68" fill="none" stroke="#252A33" strokeWidth="6" />
          <circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke={done ? '#D6B36A' : '#7C5CFF'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 68}`}
            strokeDashoffset={`${2 * Math.PI * 68 * (1 - progress / 100)}`}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <CheckCircle2 className="w-12 h-12" style={{ color: '#D6B36A' }} />
          ) : (
            <>
              <span className="text-4xl font-bold tabular-nums text-foreground" aria-live="polite">{progress}%</span>
              <span className="text-[10px] text-secondary-text uppercase tracking-widest mt-1">Rendering</span>
            </>
          )}
        </div>
      </div>

      {/* Stage info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground" aria-live="polite">
          {done ? 'Render complete!' : stages[currentStage]}
        </p>
        <p className="text-xs text-secondary-text mt-1">
          {done ? 'Your reel is ready to export.' : `Scene ${Math.min(Math.ceil(progress / 14), 7)} of 7`}
        </p>
      </div>

      {/* Progress stages */}
      <div className="w-full max-w-xs space-y-2.5" role="list" aria-label="Render progress stages">
        {stages.map((stage, i) => {
          const isDone = i < currentStage || done
          const isActive = i === currentStage && !done
          return (
            <div key={i} className="flex items-center gap-3" role="listitem">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isDone ? '#7C5CFF' : isActive ? 'rgba(124,92,255,0.2)' : '#252A33',
                  border: isActive ? '1px solid #7C5CFF' : 'none',
                }}
                aria-hidden="true"
              >
                {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className={cn('text-xs', isDone ? 'text-foreground' : isActive ? 'text-foreground' : 'text-secondary-text')}>
                {stage}
              </span>
            </div>
          )
        })}
      </div>

      {/* Estimated time */}
      {!done && (
        <p className="text-xs text-secondary-text">
          Estimated time: <strong className="text-foreground">~{Math.ceil((100 - progress) / 17)}s remaining</strong>
        </p>
      )}
    </div>
  )
}

/* ── Export Success Screen ── */
interface ExportSuccessProps {
  onNewReel: () => void
  onHome: () => void
}

export function ExportSuccessScreen({ onNewReel, onHome }: ExportSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-8 pb-24 lg:pb-8">
      {/* Success glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(214,179,106,0.3) 0%, transparent 70%)', filter: 'blur(30px)', transform: 'scale(2.5)' }}
          aria-hidden="true"
        />
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(214,179,106,0.2), rgba(214,179,106,0.05))', border: '2px solid rgba(214,179,106,0.4)' }}
        >
          <CheckCircle2 className="w-12 h-12" style={{ color: '#D6B36A' }} />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Reel Exported!</h1>
        <p className="text-secondary-text text-sm max-w-xs leading-relaxed">
          Your cinematic reel is ready. Share it to TikTok, Instagram Reels, or YouTube Shorts.
        </p>
      </div>

      {/* Reel info card */}
      <div
        className="w-full rounded-2xl p-5 flex items-center gap-4"
        style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
      >
        <div
          className="rounded-xl overflow-hidden shrink-0"
          style={{ width: 60, aspectRatio: '9/16', background: 'linear-gradient(160deg, #1A0A0A, #080910)', border: '1px solid #252A33' }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">midnight-betrayal.mp4</p>
          <p className="text-xs text-secondary-text mt-0.5">3840 × 2160 · 4K · 0:47 · 18.2 MB</p>
          <div className="flex items-center gap-1 mt-2">
            {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-current" style={{ color: '#D6B36A' }} />)}
            <span className="text-[10px] text-secondary-text ml-1">AI quality score</span>
          </div>
        </div>
      </div>

      {/* Share options */}
      <div className="w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3 text-center">Share to</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'TikTok', icon: '▶', color: '#F4F1EA', bg: '#1A1E26' },
            { name: 'Instagram', icon: '◈', color: '#D64545', bg: 'rgba(214,69,69,0.1)' },
            { name: 'YouTube', icon: '◉', color: '#D64545', bg: 'rgba(214,69,69,0.1)' },
          ].map((p) => (
            <button
              key={p.name}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-border transition-all hover:border-border/60 active:scale-95"
              style={{ backgroundColor: p.bg }}
              aria-label={`Share to ${p.name}`}
            >
              <span className="text-xl" style={{ color: p.color }} aria-hidden="true">{p.icon}</span>
              <span className="text-xs font-semibold text-foreground">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Download */}
      <button
        className="w-full py-4 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:bg-muted transition-all"
        style={{ backgroundColor: '#111318' }}
        aria-label="Download reel file"
      >
        <Download className="w-4 h-4" />
        Download to Device
      </button>

      {/* Secondary actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onHome}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-secondary-text hover:text-foreground hover:bg-muted transition-all"
          style={{ backgroundColor: '#111318' }}
        >
          Back to Home
        </button>
        <button
          onClick={onNewReel}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
        >
          New Reel
        </button>
      </div>
    </div>
  )
}

/* ── Settings Screen ── */
interface SettingsScreenProps {
  onBack: () => void
}

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', value: 'Alex Moreno' },
      { icon: Bell, label: 'Notifications', value: 'On' },
      { icon: Shield, label: 'Privacy', value: '' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { icon: CreditCard, label: 'Plan', value: 'Pro · $19/mo' },
      { icon: Zap, label: 'Reels Used', value: '18 / 30' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Mic, label: 'Default Quality', value: '4K' },
      { icon: Film, label: 'Default Style', value: 'Noir Cinéma' },
      { icon: Globe, label: 'Language', value: 'English' },
      { icon: Moon, label: 'Theme', value: 'Dark' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', value: '' },
      { icon: Star, label: 'Rate VoxReel', value: '' },
    ],
  },
]

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-6">
      {/* Header with avatar */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-foreground"
          style={{ background: 'linear-gradient(135deg, #D64545, #7C5CFF)' }}
          aria-hidden="true"
        >
          A
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Alex Moreno</h1>
          <p className="text-sm text-secondary-text">alex@voxreel.ai</p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(214,179,106,0.1)', border: '1px solid rgba(214,179,106,0.3)', color: '#D6B36A' }}
          >
            <Zap className="w-3 h-3" />
            PRO Creator
          </div>
        </div>
      </div>

      {/* Sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text px-1 mb-2">
            {section.title}
          </p>
          <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: '#111318' }}>
            {section.items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-4 hover:bg-muted transition-colors',
                    i < section.items.length - 1 ? 'border-b border-border' : ''
                  )}
                  aria-label={item.label}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#1A1E26' }}
                    aria-hidden="true"
                  >
                    <Icon className="w-3.5 h-3.5 text-secondary-text" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground text-left">{item.label}</span>
                  {item.value && (
                    <span className="text-xs text-secondary-text">{item.value}</span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-secondary-text" />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <button
        className="w-full py-4 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-muted"
        style={{ backgroundColor: '#111318', color: '#D64545' }}
        aria-label="Sign out"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* Version */}
      <p className="text-center text-[11px] text-secondary-text">VoxReel v2.4.1 · Made for storytellers</p>
    </div>
  )
}
