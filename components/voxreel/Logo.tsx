'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const dims = { sm: 24, md: 32, lg: 48 }[size]
  const textSize = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }[size]

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* V shape */}
        <path
          d="M6 10 L24 38 L42 10"
          stroke="#D64545"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Audio waveform bars inside the V */}
        <rect x="16" y="20" width="2.5" height="8" rx="1.25" fill="#F4F1EA" opacity="0.6" />
        <rect x="20.5" y="16" width="2.5" height="14" rx="1.25" fill="#F4F1EA" opacity="0.9" />
        <rect x="25" y="19" width="2.5" height="10" rx="1.25" fill="#F4F1EA" opacity="0.7" />
        <rect x="29.5" y="22" width="2.5" height="6" rx="1.25" fill="#F4F1EA" opacity="0.5" />
        {/* Play triangle hint */}
        <path d="M21 28 L27 31.5 L21 35 Z" fill="#D64545" opacity="0.8" />
        {/* Red record dot */}
        <circle cx="40" cy="10" r="4" fill="#D64545" />
        <circle cx="40" cy="10" r="2" fill="#FF6B6B" />
      </svg>

      {showText && (
        <span className={`font-bold tracking-tight text-foreground ${textSize}`}>
          Vox<span className="text-red-accent">Reel</span>
        </span>
      )}
    </div>
  )
}
