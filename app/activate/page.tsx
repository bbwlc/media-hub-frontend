import { redirect } from 'next/navigation'
import HomeLink from '../HomeLink'

type Props = {
  searchParams: Promise<{ token?: string }>
}

export default async function ActivatePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <ActivateResult success={false} />
  }

  let success = false
  try {
    const res = await fetch(`http://localhost:8080/auth/activate?token=${token}`, {
      cache: 'no-store',
    })
    success = res.ok
  } catch {
    success = false
  }

  if (success) {
    redirect('/login?activated=true')
  }

  return <ActivateResult success={false} />
}

function ActivateResult({ success }: { success: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800 text-center">
        <HomeLink />
        {success ? (
          <>
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Account activated
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your account is ready.{' '}
              <a href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                Sign in
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 text-4xl">❌</div>
            <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Invalid link
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This activation link is invalid or has already been used.
            </p>
          </>
        )}
      </div>
    </div>
  )
}