'use client'

interface EmotionBadgeProps {
  emotion: string
  color?: string
}

export function EmotionBadge({ emotion, color = '#7C5CFF' }: EmotionBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase"
      style={{
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
        color: color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {emotion}
    </span>
  )
}

interface IntensityBarProps {
  value: number
  color?: string
}

export function IntensityBar({ value, color = '#D64545' }: IntensityBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

interface MatchScoreBadgeProps {
  score: number
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  const color = score >= 90 ? '#D6B36A' : score >= 75 ? '#7C5CFF' : '#9CA3AF'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums"
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}35`,
        color,
      }}
    >
      {score}% match
    </span>
  )
}
