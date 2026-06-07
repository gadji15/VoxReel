'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Pencil, ChevronRight } from 'lucide-react'
import { useCreateFlow } from '@/components/providers/CreateFlowProvider'
import { mockScenes, mockTranscript, mockCaptions } from '@/lib/mock-data'
import { saveAnalysisAction, saveTranscriptAction } from '@/app/app/create/actions'
import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  onComplete: () => void
}

const analysisSteps = [
  { label: 'Transcribing audio...', duration: 1400 },
  { label: 'Detecting emotion arcs...', duration: 1600 },
  { label: 'Segmenting scenes...', duration: 1200 },
  { label: 'Matching cinematic clips...', duration: 1800 },
  { label: 'Applying style presets...', duration: 1000 },
  { label: 'Building storyboard...', duration: 1100 },
]

export function AnalysisProgressScreen({ onComplete }: AnalysisProgressProps) {
  const { setTranscript, setScenes, projectId } = useCreateFlow()
  // Keep the latest projectId available inside the run-once effect closure.
  const projectIdRef = useRef(projectId)
  projectIdRef.current = projectId
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let stepIdx = 0
    let totalDuration = analysisSteps.reduce((a, s) => a + s.duration, 0)
    let elapsed = 0

    const runStep = () => {
      if (stepIdx >= analysisSteps.length) {
        // Mock analysis finished — populate the shared draft from mock data so
        // the storyboard/transcript steps read coherent state. (No real STT/AI.)
        const transcript = mockTranscript.map((l) => ({ ...l }))
        const scenes = mockScenes.map((s) => ({ ...s }))
        const captions = mockCaptions.map((c) => ({ ...c }))
        setTranscript(transcript)
        setScenes(scenes)
        // Persist to Supabase for a real project (REPLACE strategy — no dupes).
        const pid = projectIdRef.current
        if (pid) {
          void saveAnalysisAction(pid, { transcript, scenes, captions }).catch(() => {
            /* best-effort; local draft already updated */
          })
        }
        setProgress(100)
        setDone(true)
        setTimeout(onComplete, 1200)
        return
      }
      setCurrentStep(stepIdx)
      const step = analysisSteps[stepIdx]
      elapsed += step.duration
      const targetProgress = Math.round((elapsed / totalDuration) * 100)

      const start = Date.now()
      const startProgress = progress

      const anim = setInterval(() => {
        const frac = Math.min((Date.now() - start) / step.duration, 1)
        setProgress(Math.round(startProgress + (targetProgress - startProgress) * frac))
        if (frac >= 1) {
          clearInterval(anim)
          stepIdx++
          setTimeout(runStep, 300)
        }
      }, 16)
    }
    runStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 py-10">
      {/* Animated circle */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
              background: done
              ? 'radial-gradient(circle, rgba(201,164,90,0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(196,60,60,0.15) 0%, transparent 70%)',
            transform: 'scale(1.6)',
            animation: done ? 'none' : 'pulse 2s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden="true">
          {/* Track */}
          <circle cx="70" cy="70" r="58" fill="none" stroke="#252A33" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r="58"
            fill="none"
            stroke={done ? '#C9A45A' : '#C43C3C'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <CheckCircle2 className="w-10 h-10" style={{ color: '#D6B36A' }} />
          ) : (
            <>
              <span className="text-3xl font-bold tabular-nums text-foreground" aria-live="polite">{progress}%</span>
              <span className="text-[10px] text-secondary-text uppercase tracking-widest mt-1">Analyzing</span>
            </>
          )}
        </div>
      </div>

      {/* Step list */}
      <div className="w-full max-w-sm space-y-3" role="list" aria-label="Analysis progress">
        {analysisSteps.map((step, i) => {
          const isComplete = i < currentStep || done
          const isActive = i === currentStep && !done

          return (
            <div key={i} className="flex items-center gap-3" role="listitem">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                )}
                style={{
                  backgroundColor: isComplete ? '#C43C3C' : isActive ? 'rgba(196,60,60,0.15)' : '#1C2029',
                  border: isActive ? '1px solid rgba(196,60,60,0.5)' : 'none',
                }}
                aria-hidden="true"
              >
                {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                {isActive && <div className="w-2 h-2 rounded-full bg-red-accent animate-pulse" />}
              </div>

              <span
                className={cn(
                  'text-sm transition-colors duration-300',
                  isComplete ? 'text-foreground font-medium' : isActive ? 'text-foreground' : 'text-secondary-text'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {done && (
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: '#C9A45A' }}>Storyboard ready</p>
          <p className="text-xs text-secondary-text mt-1">8 scenes · Noir Cinéma · 1:18</p>
        </div>
      )}
    </div>
  )
}

/* ── Transcript Review ── */
interface TranscriptReviewProps {
  onNext: () => void
  onBack: () => void
}

export function TranscriptReviewScreen({ onNext, onBack }: TranscriptReviewProps) {
  const { state, updateTranscriptLine, projectId } = useCreateFlow()
  const [editingId, setEditingId] = useState<number | null>(null)
  const lines = state.transcript

  const updateLine = (id: number, text: string) => {
    updateTranscriptLine(id, text)
  }

  // Save edits to Supabase when leaving the transcript step (real project only).
  const handleNext = () => {
    if (projectId) {
      void saveTranscriptAction(projectId, state.transcript).catch(() => {})
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Review</p>
          <h1 className="text-xl font-bold text-foreground">Transcript</h1>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'rgba(201,164,90,0.08)', border: '1px solid rgba(201,164,90,0.2)', color: '#C9A45A' }}
        >
          98% accurate
        </div>
      </div>

      {/* Audio playback bar */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: '#0E0F14', border: '1px solid #1C2029' }}
      >
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#C43C3C' }}
            aria-label="Play audio"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full w-2/5" style={{ backgroundColor: '#D64545' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-secondary-text">0:31</span>
              <span className="text-[10px] text-secondary-text">1:18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript lines */}
      <div className="flex flex-col gap-2" role="list" aria-label="Transcript lines">
        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'flex gap-3 p-4 rounded-xl border transition-all',
              editingId === line.id ? 'border-red-accent/40' : 'border-border'
            )}
            style={{ backgroundColor: '#0E0F14' }}
            role="listitem"
          >
            <span className="text-[11px] font-bold text-secondary-text tabular-nums w-8 shrink-0 pt-0.5">{line.start}</span>
            <div className="flex-1 min-w-0">
              {editingId === line.id ? (
                <textarea
                  autoFocus
                  value={line.text}
                  onChange={(e) => updateLine(line.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  className="w-full bg-transparent text-sm text-foreground resize-none outline-none leading-relaxed"
                  rows={2}
                  aria-label="Edit transcript line"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{line.text}</p>
              )}
            </div>
            <button
              onClick={() => setEditingId(editingId === line.id ? null : line.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-border transition-colors shrink-0"
              aria-label={editingId === line.id ? 'Save edit' : 'Edit this line'}
            >
              <Pencil className="w-3.5 h-3.5 text-secondary-text" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: '#C43C3C', boxShadow: '0 0 24px rgba(196,60,60,0.3)' }}
      >
        View Storyboard
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
