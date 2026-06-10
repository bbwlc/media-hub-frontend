'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { shareFile, revokeShare, type ShareRecord, type SharedFileInfo } from './actions'

type Props = {
  myFiles: string[]
  myShares: ShareRecord[]
  sharedWithMe: SharedFileInfo[]
}

export default function FileManager({ myFiles, myShares, sharedWithMe }: Props) {
  const router = useRouter()
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [pending, setPending] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  function getSharesForFile(filename: string): ShareRecord[] {
    return myShares.filter(s => s.filename === filename)
  }

  function handleToggleExpand(filename: string) {
    setExpandedFile(prev => (prev === filename ? null : filename))
    setShareTarget('')
    setIsPublic(false)
    setShareError(null)
  }

  function handleShare(filename: string) {
    const target = isPublic ? null : shareTarget.trim() || null
    setPending(true)
    setShareError(null)
    startTransition(async () => {
      const result = await shareFile(filename, target)
      setPending(false)
      if (result.error) {
        setShareError(result.error)
      } else {
        setShareTarget('')
        setIsPublic(false)
        router.refresh()
      }
    })
  }

  function handleRevoke(filename: string, sharedWith: string | null) {
    setPending(true)
    startTransition(async () => {
      await revokeShare(filename, sharedWith)
      setPending(false)
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 pt-16 dark:bg-zinc-900">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Files
        </h1>

        {myFiles.length === 0 ? (
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            No files uploaded yet. Go to your{' '}
            <a href="/profile" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
              profile
            </a>{' '}
            to upload files.
          </p>
        ) : (
          <ul className="mb-8 divide-y divide-zinc-100 dark:divide-zinc-700">
            {myFiles.map(filename => {
              const shares = getSharesForFile(filename)
              const isExpanded = expandedFile === filename
              return (
                <li key={filename} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {filename}
                    </span>
                    <button
                      onClick={() => handleToggleExpand(filename)}
                      className="shrink-0 rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    >
                      {isExpanded ? 'Close' : 'Share'}
                    </button>
                  </div>

                  {/* Existing shares */}
                  {shares.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {shares.map(s => (
                        <li
                          key={s.id}
                          className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          <span>{s.sharedWith ?? 'Public'}</span>
                          <button
                            onClick={() => handleRevoke(filename, s.sharedWith)}
                            disabled={pending}
                            className="ml-1 text-blue-400 hover:text-red-500 disabled:opacity-50"
                            aria-label="Revoke share"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Share form */}
                  {isExpanded && (
                    <div className="mt-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                      <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Share with
                      </p>
                      <label className="mb-2 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={e => setIsPublic(e.target.checked)}
                          className="rounded"
                        />
                        Make public (everyone can access)
                      </label>
                      {!isPublic && (
                        <input
                          type="text"
                          value={shareTarget}
                          onChange={e => setShareTarget(e.target.value)}
                          placeholder="Username"
                          className="mb-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                        />
                      )}
                      {shareError && (
                        <p className="mb-2 text-xs text-red-500 dark:text-red-400">{shareError}</p>
                      )}
                      <button
                        onClick={() => handleShare(filename)}
                        disabled={pending || (!isPublic && !shareTarget.trim())}
                        className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {pending ? 'Sharing…' : 'Share'}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Shared with me
        </h2>

        {sharedWithMe.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No files have been shared with you yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {sharedWithMe.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {s.filename}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    from <span className="font-medium">{s.owner}</span>
                    {s.sharedWith === null && (
                      <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        public
                      </span>
                    )}
                  </p>
                </div>
                <a
                  href={`/api/shared?owner=${encodeURIComponent(s.owner)}&file=${encodeURIComponent(s.filename)}`}
                  className="shrink-0 rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}