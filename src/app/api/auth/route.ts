import { NextResponse } from 'next/server'
import { checkPassword, grantSession, hasSession, isConfigured } from '@/lib/auth'

/** Lets the client know whether to show the password prompt. */
export async function GET() {
  return NextResponse.json({
    authenticated: await hasSession(),
    configured: isConfigured(),
  })
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Uploads are disabled until ALBUM_PASSWORD is set.' },
      { status: 503 },
    )
  }

  let password: unknown
  try {
    ({ password } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (typeof password !== 'string' || !checkPassword(password)) {
    return NextResponse.json({ error: "That's not it. Try again?" }, { status: 401 })
  }

  await grantSession()
  return NextResponse.json({ authenticated: true })
}
