import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UploadForm from './UploadForm'

function decodeUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub ?? null
  } catch {
    return null
  }
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/login')

  const username = decodeUsernameFromToken(token)
  if (!username) redirect('/login')

  const hasProfilePicture = !!cookieStore.get('profilePicture')?.value

  return <UploadForm username={username} hasProfilePicture={hasProfilePicture} />
}