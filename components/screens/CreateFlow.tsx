'use client'

import { useState, useEffect } from 'react'
import { Mic, Upload, ChevronLeft, ChevronRight, Square, Play, Pause, Check, X } from 'lucide-react'
import { AudioWaveform, StaticWaveform } from '@/components/voxreel/AudioWaveform'
import { mockStyles } from '@/lib/mock-data'
import { useCreateFlow } from '@/components/providers/CreateFlowProvider'
import { cn } from '@/lib/utils'

interface CreateFlowProps {
  step: 'upload' | 'record' | 'style'
  onNext: () => void
  onBack: () => void
}

/* ── Step 1: Audio Upload / Record ── */
export function AudioUploadScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { setAudioMetadata } = useCreateFlow()
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)

  // Persist mock audio metadata into the shared draft, then advance.
  // (Frontend-only — no real file is read or uploaded.)
  const handleContinue = () => {
    setAudioMetadata({
      fileName: 'midnight-betrayal-voice.m4a',
      duration: '1:18', // 78s
      size: '2.4 MB',
      mimeType: 'audio/mp4',
      status: 'ready',
    })
    onNext()
  }

  useEffect(() => {
    if (!isRecording) return
    const id = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isRecording])

  const toggleRecord = () => {
    if (isRecording) {
      setIsRecording(false)
      setHasRecording(true)
    } else {
      setRecordingSeconds(0)
      setHasRecording(false)
      setIsRecording(true)
    }
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Go back">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Step 1 of 3</p>
          <h1 className="text-xl font-bold text-foreground">Add Your Story</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2" aria-label="Progress">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full" style={{ backgroundColor: s === 1 ? '#D64545' : '#252A33' }} />
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex p-1 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #252A33' }} role="tablist">
        {(['record', 'upload'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={mode === m ? { backgroundColor: '#252A33', color: '#F4F1EA' } : { color: '#9CA3AF' }}
            role="tab"
            aria-selected={mode === m}
          >
            {m === 'record' ? <Mic className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {m === 'record' ? 'Record' : 'Upload'}
          </button>
        ))}
      </div>

      {mode === 'record' ? (
        <div className="flex flex-col items-center gap-8">
          {/* Waveform display */}
          <div
            className="w-full rounded-2xl border border-border p-6 flex flex-col items-center gap-5"
            style={{ backgroundColor: '#111318' }}
          >
            <AudioWaveform isActive={isRecording} color={isRecording ? '#D64545' : '#252A33'} barCount={40} height={60} />

            {/* Timer */}
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: isRecording ? '#D64545' : '#9CA3AF' }}
              aria-live="polite"
              aria-label={`Recording time: ${fmtTime(recordingSeconds)}`}
            >
              {fmtTime(recordingSeconds)}
            </span>

            {/* Status */}
            <p className="text-xs text-secondary-text">
              {isRecording ? 'Recording — speak naturally...' : hasRecording ? 'Recording complete.' : 'Tap to start recording'}
            </p>
          </div>

          {/* Record button */}
          <button
            onClick={toggleRecord}
            className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: isRecording ? 'linear-gradient(135deg, #B03030, #8A2020)' : 'linear-gradient(135deg, #D64545, #B03030)',
              boxShadow: isRecording ? '0 0 40px rgba(214,69,69,0.8), 0 0 0 8px rgba(214,69,69,0.15)' : '0 0 20px rgba(214,69,69,0.4)',
            }}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-pressed={isRecording}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {/* Recording tips */}
          <div className="w-full rounded-xl p-4" style={{ backgroundColor: 'rgba(124,92,255,0.07)', border: '1px solid rgba(124,92,255,0.18)' }}>
            <p className="text-xs font-semibold text-violet-accent mb-2">Tips for best results</p>
            <ul className="space-y-1.5">
              {['Speak at normal pace, with pauses', 'Emotional delivery = better clip matching', 'Aim for 30–90 seconds'].map((tip) => (
                <li key={tip} className="text-xs text-secondary-text flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-violet-accent mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-5 py-14 transition-colors hover:border-red-accent/40 cursor-pointer"
            style={{ backgroundColor: '#111318' }}
            role="button"
            tabIndex={0}
            aria-label="Upload audio file"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.25)' }}
              aria-hidden="true"
            >
              <Upload className="w-6 h-6 text-red-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drop audio file here</p>
              <p className="text-xs text-secondary-text mt-1">MP3, WAV, M4A — up to 200MB</p>
            </div>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#252A33', color: '#F4F1EA', border: '1px solid #353D4A' }}
            >
              Browse Files
            </button>
          </div>

          {/* Demo file */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl border border-border"
            style={{ backgroundColor: '#111318' }}
            role="listitem"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#1A1E26' }} aria-hidden="true">
              <Mic className="w-4 h-4 text-secondary-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">midnight-betrayal.mp3</p>
              <p className="text-xs text-secondary-text">1:18 · 3.4 MB</p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Play preview">
                <Play className="w-4 h-4 text-secondary-text hover:text-foreground transition-colors" />
              </button>
              <button aria-label="Remove file">
                <X className="w-4 h-4 text-secondary-text hover:text-red-accent transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {(hasRecording || mode === 'upload') && (
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)', boxShadow: '0 0 20px rgba(214,69,69,0.3)' }}
        >
          Continue to Style
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

/* Compact pill-row used for the secondary output settings. Mobile-friendly,
   premium, and additive — no redesign of the style picker. */
function SettingPillRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">{label}</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150"
              style={
                active
                  ? { backgroundColor: 'rgba(214,69,69,0.12)', border: '1px solid rgba(214,69,69,0.35)', color: '#D64545' }
                  : { backgroundColor: '#111318', border: '1px solid #252A33', color: '#9CA3AF' }
              }
              role="radio"
              aria-checked={active}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 2: Style Selection ── */
export function StyleSelectionScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, setStoryStyle, setLanguage, setVisualSource, setCaptionStyle } = useCreateFlow()
  const selected = state.storyStyle

  const handleSelect = (styleId: string) => {
    setStoryStyle(styleId)
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Go back">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Step 2 of 3</p>
          <h1 className="text-xl font-bold text-foreground">Choose a Style</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2" aria-label="Progress">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full" style={{ backgroundColor: s <= 2 ? '#D64545' : '#252A33' }} />
        ))}
      </div>

      <p className="text-sm text-secondary-text">Select the cinematic style that matches your story&apos;s mood.</p>

      <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Cinematic style">
        {mockStyles.map((style) => {
          const isSelected = selected === style.id
          return (
            <button
              key={style.id}
              onClick={() => handleSelect(style.id)}
              className="text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: isSelected ? 'rgba(214,69,69,0.06)' : '#111318',
                borderColor: isSelected ? '#D64545' : '#252A33',
                boxShadow: isSelected ? '0 0 16px rgba(214,69,69,0.1)' : 'none',
              }}
              role="radio"
              aria-checked={isSelected}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{style.name}</h3>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#1A1E26', color: '#9CA3AF', border: '1px solid #252A33' }}
                    >
                      {style.tag}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-text leading-relaxed">{style.desc}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor: isSelected ? '#D64545' : '#252A33',
                    backgroundColor: isSelected ? '#D64545' : 'transparent',
                  }}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Style color strip */}
              <div className="mt-3 h-1 rounded-full overflow-hidden bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: isSelected ? '100%' : '0%',
                    background: 'linear-gradient(90deg, #D64545, #7C5CFF)',
                    transition: 'width 300ms ease',
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Output settings — language, footage source, caption style */}
      <div
        className="flex flex-col gap-4 rounded-2xl border border-border p-4"
        style={{ backgroundColor: '#0E0F14' }}
      >
        <SettingPillRow
          label="Language"
          value={state.language}
          onChange={setLanguage}
          options={[
            { label: 'English', value: 'English' },
            { label: 'Spanish', value: 'Spanish' },
            { label: 'French', value: 'French' },
          ]}
        />
        <SettingPillRow
          label="Footage"
          value={state.visualSource}
          onChange={setVisualSource}
          options={[
            { label: 'Stock', value: 'stock' },
            { label: 'Mixed', value: 'mixed' },
            { label: 'My Uploads', value: 'upload' },
          ]}
        />
        <SettingPillRow
          label="Captions"
          value={state.captionStyle}
          onChange={setCaptionStyle}
          options={[
            { label: 'Bold Center', value: 'bold-center' },
            { label: 'Italic Bottom', value: 'italic-bottom' },
            { label: 'Impact Top', value: 'impact-top' },
          ]}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #D64545, #B03030)', boxShadow: selected ? '0 0 20px rgba(214,69,69,0.3)' : 'none' }}
      >
        Analyze My Story
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
