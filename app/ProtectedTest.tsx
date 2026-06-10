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
        <div
          className={`rounded-lg px-4 py-3 text-sm font-mono break-all
            ${result.message
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
        >
          <span className="mr-2 font-sans font-semibold">
            {result.status !== undefined ? `HTTP ${result.status}` : ''}
          </span>
          {result.message ?? result.error}
        </div>
      )}
    </div>
  )
}