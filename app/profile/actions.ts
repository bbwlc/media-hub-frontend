'use server'

import { cookies } from 'next/headers'

export type UploadState = {
  error?: string
  success?: boolean
  filename?: string
}

export async function uploadProfilePicture(
  prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'Not authenticated. Please sign in.' }
  }

  const username = decodeUsernameFromToken(token)
  if (!username) {
    return { error: 'Invalid session. Please sign in again.' }
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { error: 'Please select a file.' }
  }

  const backendForm = new FormData()
  backendForm.append('file', file)

  let res: Response
  try {
    res = await fetch(`http://localhost:8080/upload/${username}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: backendForm,
    })
  } catch {
    return { error: 'Could not reach the server. Please try again.' }
  }

  if (res.status === 403) {
    return { error: 'You are not allowed to upload to this folder.' }
  }

  if (!res.ok) {
    return { error: 'Upload failed. Please try again.' }
  }

  return { success: true, filename: file.name }
}

function decodeUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub ?? null
  } catch {
    return null
  }
}