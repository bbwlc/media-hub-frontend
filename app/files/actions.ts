'use server'

import { cookies } from 'next/headers'

export type ShareRecord = {
  id: number
  owner: string
  filename: string
  sharedWith: string | null
  createdAt: string
}

export type SharedFileInfo = {
  id: number
  owner: string
  filename: string
  sharedWith: string | null
  createdAt: string
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('token')?.value ?? null
}

export async function getMyFiles(): Promise<string[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch('http://localhost:8080/files', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getMyShares(): Promise<ShareRecord[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch('http://localhost:8080/share', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getSharedWithMe(): Promise<SharedFileInfo[]> {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch('http://localhost:8080/shared', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function shareFile(
  filename: string,
  sharedWith: string | null
): Promise<{ error?: string }> {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated.' }
  try {
    const res = await fetch(`http://localhost:8080/share/${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sharedWith }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { error: text || 'Share failed.' }
    }
    return {}
  } catch {
    return { error: 'Could not reach the server.' }
  }
}

export async function revokeShare(
  filename: string,
  sharedWith: string | null
): Promise<{ error?: string }> {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated.' }
  try {
    const res = await fetch(`http://localhost:8080/share/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sharedWith }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { error: text || 'Revoke failed.' }
    }
    return {}
  } catch {
    return { error: 'Could not reach the server.' }
  }
}