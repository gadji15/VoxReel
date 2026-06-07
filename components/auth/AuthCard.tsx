import type { ReactNode } from 'react'
import { Logo } from '@/components/voxreel/Logo'

/**
 * Shared shell for the auth pages — keeps the VoxReel dark, premium, cinematic
 * look without redesigning anything. Centered card on the app background.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        {/* Card */}
        <div
          className="rounded-3xl border border-border p-6 sm:p-7"
          style={{
            backgroundColor: '#0E0F14',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-secondary-text mt-1.5">{subtitle}</p>}
          </div>

          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-secondary-text mt-6">{footer}</p>
        )}
      </div>
    </main>
  )
}
