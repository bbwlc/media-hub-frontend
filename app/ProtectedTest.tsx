'use client'

import { useState, useTransition } from 'react'
import { callProtected, type ProtectedResult } from './actions'

export default function ProtectedTest() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ProtectedResult | null>(null)

  function handleClick() {
    startTransition(async () => {
      const res = await callProtected()
      setResult(res)
    })
  }

  const isSuccess = !!result?.message

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? 'Calling…' : 'Test protected endpoint'}
      </button>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          isSuccess
            ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <div className="mb-2 font-mono font-semibold">
            HTTP {result.status}
          </div>

          {isSuccess ? (
            <dl className="flex flex-col gap-1 font-sans">
              <div className="flex items-center gap-2">
                <dt className="w-16 text-xs font-medium opacity-60">Message</dt>
                <dd className="font-mono text-xs break-all">{result.message}</dd>
              </div>
              {result.username && (
                <div className="flex items-center gap-2">
                  <dt className="w-16 text-xs font-medium opacity-60">User</dt>
                  <dd className="font-semibold">{result.username}</dd>
                </div>
              )}
              {result.role && (
                <div className="flex items-center gap-2">
                  <dt className="w-16 text-xs font-medium opacity-60">Role</dt>
                  <dd>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      result.role === 'ROLE_ADMIN'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}>
                      {result.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="font-mono text-xs break-all">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}