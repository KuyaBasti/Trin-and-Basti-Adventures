import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hasSession } from '@/lib/auth'
import { getStorage } from '@/lib/storage'
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
  const photos: Photo[] = incoming
    .filter((p) => typeof p.src === 'string' && p.src.length > 0)
    .map((p) => ({
      id: randomUUID(),
      src: p.src as string,
      takenAt: typeof p.takenAt === 'string' ? p.takenAt : undefined,
      lat: num(p.lat),
      lng: num(p.lng),
    }))

  if (photos.length === 0) {
    return NextResponse.json({ error: 'A memory needs at least one photo.' }, { status: 400 })
  }

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

  const storage = getStorage()
  const memories = await storage.readManifest()
  await storage.writeManifest([...memories, memory])

  return NextResponse.json({ memory }, { status: 201 })
}
