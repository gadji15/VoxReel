'use client'

import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Play, Film, Zap, RefreshCw,
  Pencil, Settings2, Type, Move3D, ChevronDown, Check, X, Plus
} from 'lucide-react'
import { SceneCard } from '@/components/voxreel/SceneCard'
import { EmotionBadge, IntensityBar, MatchScoreBadge } from '@/components/voxreel/Badges'
import { BottomSheet } from '@/components/voxreel/BottomSheet'
import { VideoPreviewPhoneFrame } from '@/components/voxreel/VideoPreviewPhoneFrame'
import { mockScenes, mockCaptions, mockMotionPresets, mockTransitionPresets } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

/* ── Storyboard Screen (swipeable scenes list) ── */
interface StoryboardScreenProps {
  onSceneSelect: (id: number) => void
  onNext: () => void
  onBack: () => void
}

export function StoryboardScreen({ onSceneSelect, onNext, onBack }: StoryboardScreenProps) {
  const [activeScene, setActiveScene] = useState(4)

  const handleScene = (id: number) => {
    setActiveScene(id)
    onSceneSelect(id)
  }

  const currentScene = mockScenes.find((s) => s.id === activeScene) ?? mockScenes[0]

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Go back">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">Midnight Betrayal</p>
            <h1 className="text-xl font-bold text-foreground">Storyboard</h1>
          </div>
        </div>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
        >
          Preview
        </button>
      </div>

      {/* Project summary bar */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl border border-border"
        style={{ backgroundColor: '#111318' }}
        aria-label="Project summary"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-secondary-text uppercase tracking-wide">Scenes</p>
            <p className="text-sm font-bold text-foreground">7</p>
          </div>
          <div className="w-px h-8 bg-border" aria-hidden="true" />
          <div>
            <p className="text-[10px] text-secondary-text uppercase tracking-wide">Duration</p>
            <p className="text-sm font-bold text-foreground">0:47</p>
          </div>
          <div className="w-px h-8 bg-border" aria-hidden="true" />
          <div>
            <p className="text-[10px] text-secondary-text uppercase tracking-wide">Style</p>
            <p className="text-sm font-bold text-foreground">Noir</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs text-secondary-text hover:text-foreground transition-colors">
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Swipeable scene cards */}
      <div className="flex flex-col gap-3" role="list" aria-label="Storyboard scenes">
        {mockScenes.map((scene) => (
          <div key={scene.id} role="listitem">
            <SceneCard
              scene={scene}
              isActive={scene.id === activeScene}
              onClick={() => handleScene(scene.id)}
            />
          </div>
        ))}
      </div>

      {/* Add scene button */}
      <button
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm font-medium text-secondary-text hover:border-red-accent/40 hover:text-foreground transition-all"
        aria-label="Add a new scene"
      >
        <Plus className="w-4 h-4" />
        Add Scene
      </button>
    </div>
  )
}

/* ── Scene Detail Editor ── */
interface SceneDetailEditorProps {
  sceneId?: number
  onBack: () => void
  onNext: () => void
}

export function SceneDetailEditor({ sceneId = 4, onBack, onNext }: SceneDetailEditorProps) {
  const scene = mockScenes.find((s) => s.id === sceneId) ?? mockScenes[3]
  const [clipSheet, setClipSheet] = useState(false)
  const [captionSheet, setCaptionSheet] = useState(false)
  const [motionSheet, setMotionSheet] = useState(false)
  const [activeCaption, setActiveCaption] = useState(0)
  const [selectedMotion, setSelectedMotion] = useState(scene.motion)
  const [selectedTransition, setSelectedTransition] = useState(scene.transition)
  const [captionText, setCaptionText] = useState(scene.text)

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors" aria-label="Go back to storyboard">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-text">
            Scene {scene.index} of {scene.total}
          </p>
          <h1 className="text-xl font-bold text-foreground truncate">Scene Editor</h1>
        </div>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
        >
          Done
        </button>
      </div>

      {/* Scene preview */}
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ backgroundColor: '#111318' }}
      >
        {/* Cinematic thumbnail */}
        <div
          className="relative w-full flex items-center justify-center py-3"
          style={{ background: `linear-gradient(160deg, ${scene.emotionColor}22 0%, #080910 100%)`, minHeight: 160 }}
          aria-label="Scene visual preview"
        >
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} aria-hidden="true" />

          {/* Phone preview small */}
          <div className="relative z-10">
            <VideoPreviewPhoneFrame scene={scene} compact />
          </div>

          {/* Navigation arrows */}
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-border bg-background/80 hover:bg-card transition-colors"
            aria-label="Previous scene"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-border bg-background/80 hover:bg-card transition-colors"
            aria-label="Next scene"
          >
            <ChevronRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        {/* Scene meta */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <EmotionBadge emotion={scene.emotion} color={scene.emotionColor} />
            <span className="text-xs text-secondary-text">{scene.timeStart} – {scene.timeEnd}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">&ldquo;{scene.text}&rdquo;</p>
          <IntensityBar value={scene.intensity} color={scene.emotionColor} />
        </div>
      </div>

      {/* Editor actions */}
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="Scene editing tools">
        {[
          { label: 'Replace Clip', icon: RefreshCw, action: () => setClipSheet(true) },
          { label: 'Edit Caption', icon: Type, action: () => setCaptionSheet(true) },
          { label: 'Motion', icon: Move3D, action: () => setMotionSheet(true) },
        ].map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border hover:border-border/60 transition-all active:scale-95"
            style={{ backgroundColor: '#111318' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.2)' }}
              aria-hidden="true"
            >
              <Icon className="w-4.5 h-4.5 text-red-accent" />
            </div>
            <span className="text-[11px] font-semibold text-secondary-text text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Current clip info */}
      <div
        className="rounded-2xl border border-border p-4 flex items-center gap-3"
        style={{ backgroundColor: '#111318' }}
      >
        <div
          className="w-12 h-16 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: `linear-gradient(160deg, ${scene.emotionColor}22 0%, #0A0B0E 100%)`, border: '1px solid #252A33' }}
          aria-hidden="true"
        >
          <Film className="w-4 h-4 text-secondary-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{scene.clip}</p>
          <p className="text-xs text-secondary-text mt-0.5">{scene.timeStart} – {scene.timeEnd}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <MatchScoreBadge score={scene.clipMatch} />
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md"
              style={{ backgroundColor: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)' }}
            >
              <Zap className="w-2.5 h-2.5" style={{ color: '#7C5CFF' }} />
              <span className="text-[10px] font-medium" style={{ color: '#7C5CFF' }}>{selectedMotion}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setClipSheet(true)}
          className="px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors text-secondary-text shrink-0"
          aria-label="Replace current clip"
        >
          Replace
        </button>
      </div>

      {/* ── Clip Replacement Bottom Sheet ── */}
      <BottomSheet isOpen={clipSheet} onClose={() => setClipSheet(false)} title="Replace Clip" height="tall">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <input
            type="search"
            placeholder="Search footage library..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-secondary-text outline-none focus:border-red-accent/50 transition-colors"
            aria-label="Search clip library"
          />

          {/* Suggested clips */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">AI Suggested</p>
            <div className="flex flex-col gap-3" role="list">
              {[
                { name: 'Car interior, dashboard glow, night', match: 92, dur: '0:08' },
                { name: 'Empty road, headlights, midnight', match: 87, dur: '0:12' },
                { name: 'Rearview mirror reflection, blurred lights', match: 81, dur: '0:06' },
                { name: 'Hands on steering wheel, nervous grip', match: 78, dur: '0:09' },
              ].map((clip, i) => (
                <button
                  key={i}
                  className="flex items-center gap-3 text-left"
                  role="listitem"
                  aria-label={`Select clip: ${clip.name}`}
                >
                  <div
                    className="w-14 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ aspectRatio: '9/16', background: 'linear-gradient(160deg, #150C0C 0%, #0D0E1A 100%)', border: '1px solid #252A33' }}
                    aria-hidden="true"
                  >
                    <Film className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{clip.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MatchScoreBadge score={clip.match} />
                      <span className="text-[11px] text-secondary-text">{clip.dur}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      i === 0 ? 'border-red-accent bg-red-accent' : 'border-border'
                    )}
                    aria-hidden="true"
                  >
                    {i === 0 && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setClipSheet(false)}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
          >
            Apply Clip
          </button>
        </div>
      </BottomSheet>

      {/* ── Caption Editor Bottom Sheet ── */}
      <BottomSheet isOpen={captionSheet} onClose={() => setCaptionSheet(false)} title="Caption Editor" height="tall">
        <div className="flex flex-col gap-5">
          {/* Caption text */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-2 block">Caption Text</label>
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-secondary-text outline-none focus:border-red-accent/50 transition-colors resize-none leading-relaxed"
              rows={3}
              aria-label="Caption text"
            />
          </div>

          {/* Style presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">Style</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Caption style">
              {['Bold Center', 'Italic Bottom', 'Impact Top', 'Outline Left'].map((s, i) => (
                <button
                  key={s}
                  onClick={() => setActiveCaption(i)}
                  className="py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-left"
                  style={{
                    backgroundColor: activeCaption === i ? 'rgba(214,69,69,0.1)' : '#1A1E26',
                    borderColor: activeCaption === i ? '#D64545' : '#252A33',
                    color: activeCaption === i ? '#D64545' : '#9CA3AF',
                  }}
                  role="radio"
                  aria-checked={activeCaption === i}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Font Size</p>
              <span className="text-xs font-bold text-foreground">32px</span>
            </div>
            <input type="range" min={16} max={72} defaultValue={32} className="w-full accent-red-500" aria-label="Font size" />
          </div>

          {/* Color */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-2">Color</p>
            <div className="flex gap-3" role="radiogroup" aria-label="Caption color">
              {['#F4F1EA', '#D64545', '#D6B36A', '#7C5CFF', '#000000'].map((c) => (
                <button
                  key={c}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: c, borderColor: c === '#F4F1EA' ? '#D64545' : 'transparent' }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setCaptionSheet(false)}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
          >
            Save Caption
          </button>
        </div>
      </BottomSheet>

      {/* ── Motion & Transition Editor Bottom Sheet ── */}
      <BottomSheet isOpen={motionSheet} onClose={() => setMotionSheet(false)} title="Motion & Transitions" height="tall">
        <div className="flex flex-col gap-6">
          {/* Motion presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">Camera Motion</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Camera motion preset">
              {mockMotionPresets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMotion(m.name)}
                  className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all active:scale-95"
                  style={{
                    backgroundColor: selectedMotion === m.name ? 'rgba(124,92,255,0.1)' : '#1A1E26',
                    borderColor: selectedMotion === m.name ? '#7C5CFF' : '#252A33',
                  }}
                  role="radio"
                  aria-checked={selectedMotion === m.name}
                >
                  <span className="text-base" aria-hidden="true" style={{ color: '#7C5CFF' }}>{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-secondary-text truncate">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transition presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">Scene Transition</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Scene transition preset">
              {mockTransitionPresets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTransition(t.name)}
                  className="flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all active:scale-95"
                  style={{
                    backgroundColor: selectedTransition === t.name ? 'rgba(214,69,69,0.1)' : '#1A1E26',
                    borderColor: selectedTransition === t.name ? '#D64545' : '#252A33',
                  }}
                  role="radio"
                  aria-checked={selectedTransition === t.name}
                >
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-[10px] text-secondary-text">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Transition Duration</p>
              <span className="text-xs font-bold text-foreground">0.4s</span>
            </div>
            <input type="range" min={1} max={20} defaultValue={4} className="w-full accent-red-500" aria-label="Transition duration" />
          </div>

          <button
            onClick={() => setMotionSheet(false)}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D64545, #B03030)' }}
          >
            Apply Motion
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
