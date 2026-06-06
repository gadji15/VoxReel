'use client'

import { useEffect, useRef, useState } from 'react'

interface AudioWaveformProps {
  isActive?: boolean
  color?: string
  barCount?: number
  height?: number
}

export function AudioWaveform({
  isActive = false,
  color = '#D64545',
  barCount = 32,
  height = 40,
}: AudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => Math.random() * 0.6 + 0.1)
  )
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!isActive) {
      setBars(Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.05))
      return
    }

    const animate = () => {
      setBars((prev) =>
        prev.map((v) => {
          const delta = (Math.random() - 0.5) * 0.3
          return Math.max(0.05, Math.min(1, v + delta))
        })
      )
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, barCount])

  return (
    <div
      className="flex items-center justify-center gap-[2px]"
      style={{ height }}
      aria-hidden="true"
    >
      {bars.map((amplitude, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-75"
          style={{
            width: 3,
            height: `${amplitude * 100}%`,
            backgroundColor: color,
            opacity: isActive ? 0.7 + amplitude * 0.3 : 0.3,
          }}
        />
      ))}
    </div>
  )
}

export function StaticWaveform({ segments = 40 }: { segments?: number }) {
  const heights = Array.from({ length: segments }, (_, i) => {
    const center = segments / 2
    const dist = Math.abs(i - center) / center
    return (1 - dist * 0.6) * (0.4 + Math.sin(i * 0.8) * 0.3 + 0.3)
  })

  return (
    <div className="flex items-center gap-[2px]" style={{ height: 32 }} aria-hidden="true">
      {heights.map((h, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: `${h * 100}%`,
            backgroundColor: i < segments * 0.65 ? '#D64545' : '#252A33',
          }}
        />
      ))}
    </div>
  )
}
