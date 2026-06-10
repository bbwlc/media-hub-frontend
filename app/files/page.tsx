import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import FileManager from './FileManager'
import { getMyFiles, getMyShares, getSharedWithMe } from './actions'

function decodeUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub ?? null
  } catch {
    return null
  }
}

export default async function FilesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/login')

  const username = decodeUsernameFromToken(token)
  if (!username) redirect('/login')

  const [myFiles, myShares, sharedWithMe] = await Promise.all([
    getMyFiles(),
    getMyShares(),
    getSharedWithMe(),
  ])

  return (
    <FileManager
      myFiles={myFiles}
      myShares={myShares}
      sharedWithMe={sharedWithMe}
    />
  )
}