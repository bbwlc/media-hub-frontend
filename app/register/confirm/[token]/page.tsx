import Link from 'next/link'

type Props = {
  params: Promise<{ token: string }>
}

async function confirmRegistration(token: string): Promise<'success' | 'invalid' | 'expired' | 'error'> {
  try {
    const res = await fetch(`http://localhost:8080/auth/register/confirm/${token}`, {
      method: 'GET',
      cache: 'no-store',
    })
    if (res.status === 201) return 'success'
    if (res.status === 404) return 'invalid'
    if (res.status === 410) return 'expired'
    return 'error'
  } catch {
    return 'error'
  }
}

export default async function ConfirmPage({ params }: Props) {
  const { token } = await params
  const result = await confirmRegistration(token)

  const states = {
    success: {
      icon: '✅',
      title: 'Account activated!',
      body: 'Your account is ready. You can now sign in.',
      action: <Link href="/login" className="mt-4 inline-block rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">Sign in</Link>,
    },
    invalid: {
      icon: '❌',
      title: 'Invalid link',
      body: 'This activation link is not valid or has already been used.',
      action: <Link href="/register" className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">Register again</Link>,
    },
    expired: {
      icon: '⏰',
      title: 'Link expired',
      body: 'This activation link has expired (valid for 24 hours). Please register again.',
      action: <Link href="/register" className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">Register again</Link>,
    },
    error: {
      icon: '⚠️',
      title: 'Something went wrong',
      body: 'Could not reach the server. Please try again later.',
      action: null,
    },
  }

  const { icon, title, body, action } = states[result]

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800 text-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
        {action}
      </div>
    </div>
  )
}