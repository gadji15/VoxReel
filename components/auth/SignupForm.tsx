'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { ROUTES } from '@/lib/routes'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-secondary-text outline-none focus:border-red-accent/50 transition-colors'

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Case 1: email confirmation is required (no active session yet).
    if (!data.session) {
      setNeedsConfirmation(true)
      setLoading(false)
      return
    }

    // Case 2: confirmations are off → user is signed in immediately.
    const destination = next && next.startsWith('/app') ? next : ROUTES.APP
    router.replace(destination)
    router.refresh()
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(214,179,106,0.12)', border: '1px solid rgba(214,179,106,0.3)' }}
        >
          <MailCheck className="w-6 h-6" style={{ color: '#D6B36A' }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Confirm your email</h2>
          <p className="text-sm text-secondary-text mt-1.5">
            We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-secondary-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold text-secondary-text">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={inputClass}
          disabled={loading}
        />
      </div>

      {error && (
        <p
          className="text-sm rounded-xl px-3 py-2.5"
          style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.25)', color: '#E98080' }}
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #D64545, #B03030)', boxShadow: '0 0 20px rgba(214,69,69,0.25)' }}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
