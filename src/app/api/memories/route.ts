import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hasSession } from '@/lib/auth'
import { getStorage, isOwnSrc, updateManifest } from '@/lib/storage'
import {
  byDate,
  formatDate,
  type Memory,
  type Photo,
  type PhotoCategory,
} from '@/lib/photos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: PhotoCategory[] = [
  'travels',
  'date-nights',
  'adventures',
  'special-days',
]

export async function GET() {
  const memories = await getStorage().readManifest()
  return NextResponse.json({ memories: byDate(memories) })
}

interface IncomingPhoto {
  src?: unknown
  takenAt?: unknown
  lat?: unknown
  lng?: unknown
}

function num(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n !== 0 ? n : undefined
}

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  // JSON.parse("null") succeeds, so the annotation alone proves nothing.
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const str = (key: string) => (body[key] ?? '').toString().trim()
  const title = str('title')
  const location = str('location')
  const description = str('description')
  const takenAt = str('takenAt')

  if (!title || !location || !description || !takenAt) {
    return NextResponse.json(
      { error: 'Title, location, date and description are all needed.' },
      { status: 400 },
    )
  }

  if (Number.isNaN(Date.parse(`${takenAt}T00:00:00Z`))) {
    return NextResponse.json({ error: 'That date did not make sense.' }, { status: 400 })
  }

  const incoming = Array.isArray(body.photos) ? (body.photos as IncomingPhoto[]) : []
  const wellFormed = incoming.filter(
    (p): p is IncomingPhoto & { src: string } =>
      p != null && typeof p.src === 'string' && p.src.length > 0,
  )
  if (wellFormed.length === 0) {
    return NextResponse.json({ error: 'A memory needs at least one photo.' }, { status: 400 })
  }
  // Only images this app stored may enter the album — reject, don't drop.
  if (wellFormed.some((p) => !isOwnSrc(p.src))) {
    return NextResponse.json(
      { error: 'Photos must be uploaded through this album first.' },
      { status: 400 },
    )
  }

  const photos: Photo[] = wellFormed.map((p) => ({
    id: randomUUID(),
    src: p.src,
    takenAt: typeof p.takenAt === 'string' ? p.takenAt : undefined,
    lat: num(p.lat),
    lng: num(p.lng),
  }))

  const rawCategory = str('category') as PhotoCategory
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'adventures'

  // The memory's own pin comes from the first photo that carried coordinates.
  const located = photos.find((p) => p.lat != null && p.lng != null)

  const memory: Memory = {
    id: randomUUID(),
    title,
    location,
    date: formatDate(takenAt),
    takenAt,
    description,
    category,
    lat: num(body.lat) ?? located?.lat,
    lng: num(body.lng) ?? located?.lng,
    photos,
  }

  await updateManifest((memories) => [...memories, memory])

  return NextResponse.json({ memory }, { status: 201 })
}
