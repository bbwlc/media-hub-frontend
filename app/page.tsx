import { cookies } from 'next/headers'
import ProtectedTest from './ProtectedTest'
import SignOutButton from './SignOutButton'

function decodeUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub ?? null
  } catch {
    return null
  }
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const username = token ? decodeUsernameFromToken(token) : null
  const hasProfilePicture = !!cookieStore.get('profilePicture')?.value

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Media Hub
        </h1>

        {username ? (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              {hasProfilePicture ? (
                <img
                  src="/api/profile-picture"
                  alt="Profile picture"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                  {username[0].toUpperCase()}
                </div>
              )}
              <p className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">
                Signed in as{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
              </p>
              <SignOutButton />
            </div>
          </div>
        ) : (
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Not signed in.{' '}
            <a href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
              Sign in
            </a>
          </p>
        )}

        <nav className="mb-8 flex flex-col gap-2 text-sm">
          <a href="/register" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            → Register
          </a>
          <a href="/login" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            → Login
          </a>
          <a href="/profile" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            → Profile picture
          </a>
        </nav>

        <div className="border-t border-zinc-100 pt-6 dark:border-zinc-700">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Auth test
          </p>
          <ProtectedTest />
        </div>
      </div>
    </div>
  )
}