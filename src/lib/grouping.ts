import type { PhotoCategory } from './photos'
import { readPhotoMeta, type PhotoMeta } from './client-image'

export interface PreparedFile extends PhotoMeta {
  file: File
  previewUrl: string
}

/** One day's worth of photos, waiting for a title and a description. */
export interface Draft {
  /** The calendar day, or "undated" for photos that carried no EXIF. */
  key: string
  takenAt: string
  title: string
  location: string
  description: string
  category: PhotoCategory
  files: PreparedFile[]
  /** Set false to leave this day out of the import. */
  include: boolean
}

export const UNDATED = 'undated'

/**
 * Reads every file's metadata, then buckets them by the day they were taken.
 * A trip to the Tea Garden becomes one draft holding twelve photos rather than
 * twelve drafts, which is the difference between writing one description and
 * writing twelve.
 */
export async function buildDrafts(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<Draft[]> {
  const prepared: PreparedFile[] = []

  for (const [index, file] of files.entries()) {
    // Coordinates only; place names are resolved later so the rate-limited
    // geocoder never holds up reading the batch.
    const meta = await readPhotoMeta(file, { resolvePlace: false })
    prepared.push({ ...meta, file, previewUrl: URL.createObjectURL(file) })
    onProgress?.(index + 1, files.length)
  }

  const buckets = new Map<string, PreparedFile[]>()
  for (const item of prepared) {
    const key = item.takenAt ?? UNDATED
    const bucket = buckets.get(key)
    if (bucket) bucket.push(item)
    else buckets.set(key, [item])
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      if (a === UNDATED) return 1
      if (b === UNDATED) return -1
      return a.localeCompare(b)
    })
    .map(([key, group]) => ({
      key,
      takenAt: key === UNDATED ? '' : key,
      title: '',
      location: '',
      description: '',
      category: 'adventures' as PhotoCategory,
      files: group,
      include: true,
    }))
}

/** First coordinates found in a day, used for its map pin and place name. */
export function coordsOf(draft: Draft): { lat: number; lng: number } | undefined {
  const located = draft.files.find((f) => f.lat != null && f.lng != null)
  return located ? { lat: located.lat!, lng: located.lng! } : undefined
}
