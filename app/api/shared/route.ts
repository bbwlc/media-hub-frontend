import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const file = searchParams.get('file')

  if (!owner || !file) {
    return new NextResponse(null, { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return new NextResponse(null, { status: 401 })
  }

  let res: Response
  try {
    res = await fetch(
      `http://localhost:8080/shared/${encodeURIComponent(owner)}?file=${encodeURIComponent(file)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
  } catch {
    return new NextResponse(null, { status: 502 })
  }

  if (!res.ok) {
    return new NextResponse(null, { status: res.status })
  }

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': res.headers.get('Content-Disposition') ?? `attachment; filename="${file}"`,
    },
  })
}