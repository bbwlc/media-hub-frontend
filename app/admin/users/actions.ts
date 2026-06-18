'use server'

import { cookies } from 'next/headers'

export type UserRecord = {
  username: string
  email: string | null
  role: string
  status: 'UNVERIFIED' | 'VERIFIED' | 'LOCKED'
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('token')?.value ?? null
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch('http://localhost:8080/users', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function updateUserStatus(
  username: string,
  status: 'VERIFIED' | 'LOCKED'
): Promise<{ error?: string }> {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated.' }
  try {
    const res = await fetch(
      `http://localhost:8080/users/${encodeURIComponent(username)}/status?status=${status}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (res.status === 403) return { error: 'Admin access required.' }
    if (!res.ok) return { error: 'Status update failed.' }
    return {}
  } catch {
    return { error: 'Could not reach the server.' }
  }
}