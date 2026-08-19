export type PhotoCategory = 'travels' | 'date-nights' | 'adventures' | 'special-days'

/** A single image inside a memory. */
export interface Photo {
  id: string
  src: string
  /** ISO date from the camera, used to order photos within a memory. */
  takenAt?: string
  lat?: number
  lng?: number
}

/**
 * A day or an outing: one description, one place, and every photo taken there.
 * Twelve shots from the Tea Garden are one memory, not twelve.
 */
export interface Memory {
  id: string
  title: string
  location: string
  /** Display form, e.g. "March 28, 2025". */
  date: string
  /** ISO form, used for sorting. */
  takenAt: string
  description: string
  category: PhotoCategory
  lat?: number
  lng?: number
  photos: Photo[]
  /** Which photo fronts the card. Falls back to the first. */
  coverId?: string
}

// Category filtering was removed from the UI (2026-08-14, Basti's call — two
// categories for a two-person album was UI without a problem). The `category`
// field stays on stored memories, harmless, in case it's ever wanted again.

export function coverOf(memory: Memory): Photo | undefined {
  return memory.photos.find((p) => p.id === memory.coverId) ?? memory.photos[0]
}

/** Photos within a memory: dated ones in order, undated ones last, stable. */
export function sortPhotos(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    if (!a.takenAt && !b.takenAt) return 0
    if (!a.takenAt) return 1
    if (!b.takenAt) return -1
    return a.takenAt.localeCompare(b.takenAt)
  })
}

/** Oldest first, so the album reads as a story. */
export function byDate<T extends { takenAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
}

/**
 * "2025-03-21" -> "March 21, 2025". Formatted in UTC on purpose: parsing a bare
 * date string yields UTC midnight, which local formatting would render as the
 * previous day for anyone west of Greenwich.
 */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Google Maps link for a memory. Prefers exact EXIF coordinates when we have
 * them, since a typed place name can be ambiguous.
 */
export function mapsUrl(memory: Pick<Memory, 'location' | 'lat' | 'lng'>): string {
  const query =
    memory.lat != null && memory.lng != null
      ? `${memory.lat},${memory.lng}`
      : memory.location
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}`
}
