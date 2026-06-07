import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from '@/components/auth/SignupForm'
import { ROUTES } from '@/lib/routes'

export const metadata = {
  title: 'Create account — VoxReel',
}

/** Public signup page. Middleware redirects signed-in users to /app. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start turning voice stories into cinematic reels."
      footer={
        <>
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="font-semibold text-red-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  )
}
