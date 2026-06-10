'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type LoginState = {
  error?: string
}

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get('username') as string).trim()
  const password = formData.get('password') as string

  let res: Response
  try {
    res = await fetch('http://localhost:8080/auth/signIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    return { error: 'Could not reach the server. Please try again.' }
  }

  if (res.status === 401) {
    return { error: 'Invalid username or password.' }
  }

  if (!res.ok) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const { token } = await res.json()
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600,
  })

  redirect('/')
}