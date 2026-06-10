import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function decodeUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const filename = cookieStore.get('profilePicture')?.value

  if (!token || !filename) {
    return new NextResponse(null, { status: 404 })
  }

  const username = decodeUsernameFromToken(token)
  if (!username) {
    return new NextResponse(null, { status: 401 })
  }

  let res: Response
  try {
    res = await fetch(
      `http://localhost:8080/download/${username}?file=${encodeURIComponent(filename)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
  } catch {
    return new NextResponse(null, { status: 502 })
  }

  if (!res.ok) {
    return new NextResponse(null, { status: res.status })
  }

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('Content-Type') ?? 'image/jpeg'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=60',
    },
  })
}