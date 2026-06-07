import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import { ROUTES } from '@/lib/routes'

export const metadata = {
  title: 'Sign in — VoxReel',
}

/** Public login page. Middleware redirects signed-in users to /app. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue creating cinematic reels."
      footer={
        <>
          New to VoxReel?{' '}
          <Link href={ROUTES.SIGNUP} className="font-semibold text-red-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <p
          className="text-sm rounded-xl px-3 py-2.5 mb-4"
          style={{ backgroundColor: 'rgba(214,69,69,0.1)', border: '1px solid rgba(214,69,69,0.25)', color: '#E98080' }}
          role="alert"
        >
          We couldn&apos;t complete that sign-in. Please try again.
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  )
}
