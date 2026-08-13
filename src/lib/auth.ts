import { createHmac, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'album_session'

/**
 * The shared secret. In development we fall back to a known value so the upload
 * flow is testable straight after `npm run dev`. In production there is no
 * fallback: if ALBUM_PASSWORD is unset, uploads are refused for everyone rather
 * than opened to everyone.
 */
function secret(): string | null {
  const configured = process.env.ALBUM_PASSWORD
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') return null
  return 'letmein'
}

export function isConfigured(): boolean {
  return secret() !== null
}

/** Constant-time comparison over fixed-length digests. */
function matches(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function checkPassword(attempt: string): boolean {
  const expected = secret()
  if (expected === null) return false
  return matches(attempt, expected)
}

/** Opaque session value derived from the secret, so it can be re-verified. */
function sessionToken(): string {
  const expected = secret()
  if (expected === null) throw new Error('ALBUM_PASSWORD is not configured')
  return createHmac('sha256', expected).update('album-session-v1').digest('hex')
}

export async function grantSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function hasSession(): Promise<boolean> {
  if (!isConfigured()) return false
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  if (!value) return false
  try {
    return matches(value, sessionToken())
  } catch {
    return false
  }
}
