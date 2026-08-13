import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hasSession } from '@/lib/auth'
import { isOwnSrc, updateManifest } from '@/lib/storage'
import { sortPhotos, type Memory, type Photo } from '@/lib/photos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

/**
 * Edits one memory: append photos (`addPhotos`) and/or choose its cover
 * (`coverId`). This is how a day's remaining photos join the memory that
 * already tells that day's story, instead of becoming a duplicate entry.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { id } = await params

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

  const incoming = Array.isArray(body.addPhotos) ? (body.addPhotos as IncomingPhoto[]) : []
  const wellFormed = incoming.filter(
    (p): p is IncomingPhoto & { src: string } =>
      p != null && typeof p.src === 'string' && p.src.length > 0,
  )
  if (incoming.length > 0 && wellFormed.length === 0) {
    return NextResponse.json({ error: 'No usable photos to add.' }, { status: 400 })
  }
  // Only images this app stored may enter the album — reject, don't drop.
  if (wellFormed.some((p) => !isOwnSrc(p.src))) {
    return NextResponse.json(
      { error: 'Photos must be uploaded through this album first.' },
      { status: 400 },
    )
  }
  if (incoming.length === 0 && body.coverId === undefined) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
  }

  const added: Photo[] = wellFormed.map((p) => ({
    id: randomUUID(),
    src: p.src,
    takenAt: typeof p.takenAt === 'string' ? p.takenAt : undefined,
    lat: num(p.lat),
    lng: num(p.lng),
  }))

  // All validation against current state happens inside the serialized
  // mutation, so it can't act on a manifest another write just changed.
  let failure: { status: number; error: string } | null = null
  let updated: Memory | null = null

  await updateManifest((memories) => {
    const index = memories.findIndex((m) => m.id === id)
    if (index === -1) {
      failure = { status: 404, error: 'That memory does not exist.' }
      return null
    }

    const memory = { ...memories[index] }

    if (added.length > 0) {
      // A retried import may resend photos that already landed; skipping
      // them (by stored URL) makes the retry harmless instead of doubling.
      const fresh = added.filter((p) => !memory.photos.some((e) => e.src === p.src))

      if (fresh.length > 0) {
        // Pin what the card currently fronts before anything moves, so
        // "add photos" never silently changes the cover…
        if (!memory.coverId && memory.photos[0]) {
          memory.coverId = memory.photos[0].id
        }
        // …and append rather than re-sort, so the existing story order is
        // never rearranged behind the user's back.
        memory.photos = [...memory.photos, ...sortPhotos(fresh)]

        // A memory that never had a map pin adopts one from its new photos.
        if (memory.lat == null || memory.lng == null) {
          const located = fresh.find((p) => p.lat != null && p.lng != null)
          if (located) {
            memory.lat = located.lat
            memory.lng = located.lng
          }
        }
      }
    }

    if (body.coverId !== undefined) {
      if (
        typeof body.coverId !== 'string' ||
        !memory.photos.some((p) => p.id === body.coverId)
      ) {
        failure = { status: 400, error: 'coverId must name a photo in this memory.' }
        return null
      }
      memory.coverId = body.coverId
    }

    updated = memory
    const next = [...memories]
    next[index] = memory
    return next
  })

  if (failure !== null) {
    const f = failure as { status: number; error: string }
    return NextResponse.json({ error: f.error }, { status: f.status })
  }
  return NextResponse.json({ memory: updated })
}
