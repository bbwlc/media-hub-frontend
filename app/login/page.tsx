'use client'

import { useActionState, useState, startTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { login } from './actions'

type FieldErrors = {
  username?: string
  password?: string
}

const inputClass = (error?: string) =>
  `rounded-lg border px-3 py-2 text-sm outline-none transition-colors
   dark:bg-zinc-700 dark:text-zinc-50
   ${error
     ? 'border-red-400 focus:border-red-500 dark:border-red-500'
     : 'border-zinc-300 focus:border-zinc-900 dark:border-zinc-600 dark:focus:border-zinc-400'
   }`

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 dark:text-red-400">{message}</p>
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {})
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const params = useSearchParams()
  const activated = params.get('activated') === 'true'

  function validate(data: FormData): FieldErrors {
    const errors: FieldErrors = {}
    if (!(data.get('username') as string).trim()) {
      errors.username = 'Username is required.'
    }
    if (!(data.get('password') as string)) {
      errors.password = 'Password is required.'
    }
    return errors
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">

        {activated && (
          <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Account activated — you can now sign in.
          </div>
        )}

        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const errors = validate(formData)
            setFieldErrors(errors)
            if (Object.keys(errors).length === 0) {
              startTransition(() => formAction(formData))
            }
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          {state.error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className={inputClass(fieldErrors.username)}
            />
            <FieldError message={fieldErrors.username} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={inputClass(fieldErrors.password)}
            />
            <FieldError message={fieldErrors.password} />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account yet?{' '}
          <a href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}