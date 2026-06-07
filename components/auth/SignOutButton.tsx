'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { ROUTES } from '@/lib/routes'

/**
 * Signs the current user out and redirects to /login. Styled to match the
 * existing VoxReel Settings "Sign Out" control (no UI redesign).
 */
export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace(ROUTES.LOGIN)
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full py-4 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-muted disabled:opacity-60"
      style={{ backgroundColor: '#111318', color: '#D64545' }}
      aria-label="Sign out"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}
