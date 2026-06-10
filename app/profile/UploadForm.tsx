'use client'

import { useActionState, useState, startTransition } from 'react'
import { uploadProfilePicture } from './actions'

type Props = {
  username: string
  hasProfilePicture: boolean
}

export default function UploadForm({ username, hasProfilePicture }: Props) {
  const [state, formAction, pending] = useActionState(uploadProfilePicture, {})
  const [preview, setPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // After a successful upload the blob URL is used for instant display.
  // On subsequent page loads the server URL is used instead.
  const displaySrc = state.success
    ? (preview ?? '/api/profile-picture')
    : hasProfilePicture
      ? '/api/profile-picture'
      : null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) { setPreview(null); return }
    if (!file.type.startsWith('image/')) {
      setFileError('Only image files are allowed.')
      setPreview(null)
      e.target.value = ''
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile picture
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
        </p>

        {/* Always-visible picture area */}
        <div className="mb-6 flex justify-center">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt="Profile picture"
              className="h-28 w-28 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-100 text-4xl text-zinc-400 dark:bg-zinc-700">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>

        {state.success && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-center text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            "{state.filename}" uploaded successfully.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const file = formData.get('file') as File | null
            if (!file || file.size === 0) {
              setFileError('Please select a file.')
              return
            }
            setFileError(null)
            startTransition(() => formAction(formData))
          }}
          className="flex flex-col gap-4"
        >
          {state.error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="file" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {hasProfilePicture || state.success ? 'Replace picture' : 'Choose image'}
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:border-zinc-600 dark:text-zinc-300 dark:file:bg-zinc-700 dark:file:text-zinc-300"
            />
            {fileError && (
              <p className="text-xs text-red-500 dark:text-red-400">{fileError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  )
}