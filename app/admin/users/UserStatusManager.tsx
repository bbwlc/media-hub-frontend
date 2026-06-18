'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserStatus, type UserRecord } from './actions'
import HomeLink from '@/app/HomeLink'

const STATUS_STYLE: Record<string, string> = {
  VERIFIED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNVERIFIED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOCKED:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function UserStatusManager({ users }: { users: UserRecord[] }) {
  const router = useRouter()
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(username: string, status: 'VERIFIED' | 'LOCKED') {
    setPendingUser(username)
    setError(null)
    startTransition(async () => {
      const result = await updateUserStatus(username, status)
      setPendingUser(null)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 pt-16 dark:bg-zinc-900">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <HomeLink />
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          User Management
        </h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}

        {users.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {users.map((user) => (
                <tr key={user.username}>
                  <td className="py-3 pr-4 font-medium text-zinc-800 dark:text-zinc-200">
                    {user.username}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                    {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 flex gap-2">
                    {user.status !== 'VERIFIED' && (
                      <button
                        onClick={() => handleStatusChange(user.username, 'VERIFIED')}
                        disabled={pendingUser === user.username}
                        className="appearance-none rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                      >
                        Verify
                      </button>
                    )}
                    {user.status !== 'LOCKED' && (
                      <button
                        onClick={() => handleStatusChange(user.username, 'LOCKED')}
                        disabled={pendingUser === user.username}
                        className="appearance-none rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        Lock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}