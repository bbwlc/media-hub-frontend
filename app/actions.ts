'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type ProtectedResult = {
  message?: string
  error?: string
  status?: number
}

export async function callProtected(): Promise<ProtectedResult> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'Not authenticated — please sign in first.', status: 401 }
  }

  let res: Response
  try {
    res = await fetch('http://localhost:8080/auth/protected', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return { error: 'Could not reach the server.', status: 0 }
  }

  const text = await res.text()
  if (!res.ok) {
    return { error: text, status: res.status }
  }
  return { message: text, status: res.status }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (token) {
    try {
      await fetch('http://localhost:8080/auth/signOut', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // local sign-out proceeds regardless of backend error
    }
  }

  cookieStore.delete('token')
  redirect('/login')
}