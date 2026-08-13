import exifr from 'exifr'

export interface PhotoMeta {
  /** YYYY-MM-DD, taken from the camera's own record of the moment. */
  takenAt?: string
  lat?: number
  lng?: number
  /** Best-effort place name resolved from the coordinates. */
  place?: string
}

/** Longest edge we keep. Comfortably sharp on a retina screen, small to send. */
const MAX_EDGE = 2400
const JPEG_QUALITY = 0.82

function toIsoDate(value: unknown): string | undefined {
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return undefined
  // Camera timestamps are already local to where the photo was taken, so read
  // the local parts rather than shifting through UTC.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Pulls the date and coordinates the camera recorded. Everything here is
 * best-effort: screenshots and heavily edited exports often carry no EXIF at
 * all, in which case the user just fills the fields in by hand.
 */
export async function readPhotoMeta(
  file: File,
  options: { resolvePlace?: boolean } = {},
): Promise<PhotoMeta> {
  const { resolvePlace = true } = options
  let parsed: Record<string, unknown> | undefined
  try {
    parsed = await exifr.parse(file, { tiff: true, exif: true, gps: true })
  } catch {
    return {}
  }
  if (!parsed) return {}

  const takenAt =
    toIsoDate(parsed.DateTimeOriginal) ??
    toIsoDate(parsed.CreateDate) ??
    toIsoDate(parsed.ModifyDate)

  const lat = typeof parsed.latitude === 'number' ? parsed.latitude : undefined
  const lng = typeof parsed.longitude === 'number' ? parsed.longitude : undefined

  const meta: PhotoMeta = { takenAt, lat, lng }
  if (resolvePlace && lat != null && lng != null) {
    meta.place = await reverseGeocode(lat, lng)
  }
  return meta
}

/**
 * Coordinates -> "Golden Gate Park, San Francisco". Uses OpenStreetMap's free
 * service; if it is slow or unreachable we simply leave the field blank rather
 * than hold up the upload.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) return undefined
    const data = await res.json()
    const a = data?.address
    if (!a) return undefined

    const spot = a.leisure || a.tourism || a.amenity || a.park || a.building
    const city = a.city || a.town || a.village || a.suburb || a.county
    const state = a.state_code || a.state
    return [spot, city, state].filter(Boolean).join(', ') || undefined
  } catch {
    return undefined
  }
}

/**
 * Shrinks and re-encodes to JPEG in the browser. A modern phone photo is
 * 5-15MB, which no serverless upload will accept; this brings it under a
 * megabyte before it ever leaves the device.
 */
export async function compressImage(file: File): Promise<File> {
  // `from-image` applies the EXIF orientation flag, so portrait shots don't
  // arrive sideways once the metadata is dropped during re-encoding.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the image.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('Could not compress the image.')

  return new File([blob], 'memory.jpg', { type: 'image/jpeg' })
}
