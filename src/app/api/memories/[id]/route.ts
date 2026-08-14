import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hasSession } from '@/lib/auth'
import { getStorage, isOwnSrc, updateManifest } from '@/lib/storage'
import {
  formatDate,
  sortPhotos,
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

/** Best-effort cleanup of stored images — an orphan beats a blocked edit. */
async function deleteImages(srcs: string[]) {
  const storage = getStorage()
  await Promise.allSettled(srcs.map((src) => storage.deleteImage(src)))
}

/**
 * Edits one memory. Any combination of:
 * - `addPhotos`      append photos (same shape as POST's `photos`)
 * - `removePhotoIds` take photos out (never the last one)
 * - `coverId`        choose which photo fronts the card
 * - `title` / `location` / `description` / `category` / `takenAt`  rewrite text
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

  // ---- validate everything that doesn't need current state ----

  const incoming = Array.isArray(body.addPhotos) ? (body.addPhotos as IncomingPhoto[]) : []
  const wellFormed = incoming.filter(
    (p): p is IncomingPhoto & { src: string } =>
      p != null && typeof p.src === 'string' && p.src.length > 0,
  )
  if (incoming.length > 0 && wellFormed.length === 0) {
    return NextResponse.json({ error: 'No usable photos to add.' }, { status: 400 })
  }
  if (wellFormed.some((p) => !isOwnSrc(p.src))) {
    return NextResponse.json(
      { error: 'Photos must be uploaded through this album first.' },
      { status: 400 },
    )
  }

  const removeIds = Array.isArray(body.removePhotoIds)
    ? (body.removePhotoIds as unknown[]).filter((v): v is string => typeof v === 'string')
    : []

  const text: Partial<Pick<Memory, 'title' | 'location' | 'description'>> = {}
  for (const key of ['title', 'location', 'description'] as const) {
    if (body[key] !== undefined) {
      // Reject, don't coerce: String(null) would store the literal "null".
      if (typeof body[key] !== 'string') {
        return NextResponse.json({ error: `${key} must be text.` }, { status: 400 })
      }
      const value = (body[key] as string).trim()
      if (!value) {
        return NextResponse.json({ error: `${key} cannot be empty.` }, { status: 400 })
      }
      text[key] = value
    }
  }

  let takenAt: string | undefined
  if (body.takenAt !== undefined) {
    takenAt = typeof body.takenAt === 'string' ? body.takenAt.trim() : ''
    // Strict YYYY-MM-DD with a round-trip: the album's chronology is a
    // localeCompare over these strings, so "2025-6-1" would sort wrong even
    // though Date.parse accepts it.
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(takenAt) ||
      new Date(`${takenAt}T00:00:00Z`).toISOString().slice(0, 10) !== takenAt
    ) {
      return NextResponse.json({ error: 'That date did not make sense.' }, { status: 400 })
    }
  }

  let category: PhotoCategory | undefined
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category as PhotoCategory)) {
      return NextResponse.json({ error: 'Unknown category.' }, { status: 400 })
    }
    category = body.category as PhotoCategory
  }

  const changesAnything =
    incoming.length > 0 ||
    removeIds.length > 0 ||
    body.coverId !== undefined ||
    Object.keys(text).length > 0 ||
    takenAt !== undefined ||
    category !== undefined
  if (!changesAnything) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
  }

  const added: Photo[] = wellFormed.map((p) => ({
    id: randomUUID(),
    src: p.src,
    takenAt: typeof p.takenAt === 'string' ? p.takenAt : undefined,
    lat: num(p.lat),
    lng: num(p.lng),
  }))

  // ---- apply atomically against current state ----

  let failure: { status: number; error: string } | null = null
  let updated: Memory | null = null
  let removedSrcs: string[] = []

  await updateManifest((memories) => {
    const index = memories.findIndex((m) => m.id === id)
    if (index === -1) {
      failure = { status: 404, error: 'That memory does not exist.' }
      return null
    }

    const memory = { ...memories[index], ...text }
    if (category) memory.category = category
    if (takenAt) {
      memory.takenAt = takenAt
      memory.date = formatDate(takenAt)
    }

    if (removeIds.length > 0) {
      const removing = memory.photos.filter((p) => removeIds.includes(p.id))
      const remaining = memory.photos.filter((p) => !removeIds.includes(p.id))
      // Unknown ids are ignored on purpose: a retried remove is a no-op.
      if (remaining.length === 0) {
        failure = {
          status: 400,
          error: 'A memory needs at least one photo — delete the whole memory instead.',
        }
        return null
      }
      memory.photos = remaining
      removedSrcs = removing.map((p) => p.src)
      if (memory.coverId && !remaining.some((p) => p.id === memory.coverId)) {
        memory.coverId = remaining[0].id
      }
    }

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
    // Never delete a file the manifest being written still references — a
    // remove+re-add of the same src in one request, or a src shared with
    // another memory, must keep its file.
    removedSrcs = removedSrcs.filter(
      (src) => !next.some((m) => m.photos.some((p) => p.src === src)),
    )
    return next
  })

  if (failure !== null) {
    const f = failure as { status: number; error: string }
    return NextResponse.json({ error: f.error }, { status: f.status })
  }

  // Only after the manifest write is durable do stored files get cleaned up.
  if (removedSrcs.length > 0) await deleteImages(removedSrcs)

  return NextResponse.json({ memory: updated })
}

/** Deletes a memory and (best-effort) its stored images. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { id } = await params

  let removedSrcs: string[] = []

  await updateManifest((memories) => {
    const index = memories.findIndex((m) => m.id === id)
    // Already gone — a retried delete (response lost, user clicks again) is
    // a success, not a 404 the UI would show as failure.
    if (index === -1) return null
    const next = memories.filter((m) => m.id !== id)
    // Only delete files no surviving memory still references.
    const live = new Set(next.flatMap((m) => m.photos.map((p) => p.src)))
    removedSrcs = memories[index].photos.map((p) => p.src).filter((s) => !live.has(s))
    return next
  })

  if (removedSrcs.length > 0) await deleteImages(removedSrcs)

  return NextResponse.json({ deleted: id })
}
