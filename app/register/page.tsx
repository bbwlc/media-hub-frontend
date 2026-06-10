'use client'

import { useActionState, useState, startTransition } from 'react'
import { register } from './actions'

type FieldErrors = {
  username?: string
  password?: string
  confirmPassword?: string
  email?: string
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

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, {})
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800 text-center">
          <div className="mb-4 text-4xl">📬</div>
          <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Check your email
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            We sent an activation link to your address. Click it to complete your registration.
          </p>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            (Dev mode: see the activation link in the backend console)
          </p>
        </div>
      </div>
    )
  }

  function validate(data: FormData): FieldErrors {
    const errors: FieldErrors = {}
    const username = (data.get('username') as string).trim()
    const password = data.get('password') as string
    const confirmPassword = data.get('confirmPassword') as string
    const email = (data.get('email') as string).trim()

    if (!username) {
      errors.username = 'Username is required.'
    }
    if (!password) {
      errors.password = 'Password is required.'
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.'
    }
    if (!email) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    return errors
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create account
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
              autoComplete="new-password"
              className={inputClass(fieldErrors.password)}
            />
            <FieldError message={fieldErrors.password} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass(fieldErrors.confirmPassword)}
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={inputClass(fieldErrors.email)}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}