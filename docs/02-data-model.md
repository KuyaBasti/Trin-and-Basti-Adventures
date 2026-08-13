# Data model

One JSON manifest, two TypeScript types, three storage methods. No database.

## Types (`src/lib/photos.ts`)

```ts
interface Photo {
  id: string          // UUID, assigned server-side
  src: string         // /uploads/… (dev) or https://…blob.vercel-storage.com/… (prod)
  takenAt?: string    // ISO date from EXIF; orders photos within a memory
  lat?: number        // EXIF GPS, when the photo carried it
  lng?: number
}

interface Memory {
  id: string          // UUID (seeds use slugs: 'tea-garden', 'featured')
  title: string
  location: string    // human place name, shown under the title
  date: string        // display form: "March 28, 2025"
  takenAt: string     // ISO form: "2025-03-28" — the sort key
  description: string // the point of the whole site
  category: 'travels' | 'date-nights' | 'adventures' | 'special-days'
  lat?: number        // memory's map pin — first photo that had GPS,
  lng?: number        //   unless explicitly provided
  photos: Photo[]     // ≥1, ordered by takenAt
  coverId?: string    // which photo fronts the card; defaults to photos[0]
}
```

Invariants:

- `date` and `takenAt` describe the same day; `formatDate()` derives one from
  the other **in UTC** (local formatting would show the previous day west of
  Greenwich).
- A memory has at least one photo — enforced by `POST /api/memories`.
- Sorting is `takenAt.localeCompare` ascending everywhere: the album is a
  story told oldest-first.
- The memory with id `featured` (`FEATURED_ID`) is pinned to the hero slot and
  excluded from the grid and filters.

## The manifest

`memories.json` — a plain `Memory[]` — lives beside the images in whichever
store is active and is read once per page load (`GET /api/memories`). A few
hundred memories ≈ a few hundred KB.

- **Seeding:** first `readManifest()` that finds no manifest writes
  `SEED_MEMORIES` (`src/data/seed-memories.ts`) — the 11 original hardcoded
  entries as one-photo memories. **After that the manifest is the only truth**;
  editing the seed file is a no-op.
- **Writes:** append + rewrite whole file. Last-write-wins, no locking — two
  users importing in the same second could drop one memory. Accepted at this
  scale; revisit only if it ever actually happens.

## Storage drivers (`src/lib/storage.ts`)

```ts
interface StorageDriver {
  readManifest(): Promise<Memory[]>
  writeManifest(memories: Memory[]): Promise<void>
  saveImage(filename: string, bytes: Buffer, contentType: string): Promise<string>
}
```

`getStorage()` picks by environment — `BLOB_READ_WRITE_TOKEN` set ⇒ Blob,
else local disk:

| | Local (dev) | Vercel Blob (prod) |
|---|---|---|
| Manifest | `.data/memories.json` | `memories.json`, stable URL: `addRandomSuffix: false`, `allowOverwrite: true`, `cacheControlMaxAge: 0` |
| Images | `public/uploads/<uuid>.<ext>` | `memories/<uuid>.<ext>`, random suffix, immutable |
| Git | both paths git-ignored | — |

The interface is deliberately three methods so a future storage move
(Supabase, S3) is one new ~40-line driver, nothing else.

## Auth (`src/lib/auth.ts`)

Not user data — one shared secret. `ALBUM_PASSWORD` (dev fallback `letmein`;
production unset ⇒ **uploads refused**). Session = httpOnly sameSite=lax
cookie holding `HMAC-SHA256(secret, "album-session-v1")`, verified with
`timingSafeEqual` over SHA-256 digests, max-age one year. Reads are public;
`POST /api/upload` and `POST /api/memories` require the cookie.
