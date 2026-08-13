import type { Memory } from './photos'
import { SEED_MEMORIES } from '@/data/seed-memories'

const MANIFEST = 'memories.json'

export interface StorageDriver {
  /** Every memory in the album, seeded on first read. */
  readManifest(): Promise<Memory[]>
  writeManifest(memories: Memory[]): Promise<void>
  /** Stores the image bytes and returns a URL usable in <Image src>. */
  saveImage(filename: string, bytes: Buffer, contentType: string): Promise<string>
}

/**
 * Local disk. Used in `npm run dev` so the upload flow works with no account,
 * no token, and no network. Vercel's filesystem is read-only, so this driver is
 * never what runs in production.
 */
function localDriver(): StorageDriver {
  const node = async () => ({
    fs: await import('fs/promises'),
    path: await import('path'),
  })

  return {
    async readManifest() {
      const { fs, path } = await node()
      try {
        const raw = await fs.readFile(
          path.join(process.cwd(), '.data', MANIFEST),
          'utf8',
        )
        return JSON.parse(raw) as Memory[]
      } catch {
        // First run: lay down the memories that used to be hardcoded. If even
        // that write fails (a production deploy before the Blob store exists
        // runs this driver on a read-only filesystem), still serve the seeds —
        // a read-only album beats a 500.
        try {
          await this.writeManifest(SEED_MEMORIES)
        } catch {}
        return SEED_MEMORIES
      }
    },

    async writeManifest(memories) {
      const { fs, path } = await node()
      const dir = path.join(process.cwd(), '.data')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(
        path.join(dir, MANIFEST),
        JSON.stringify(memories, null, 2),
        'utf8',
      )
    },

    async saveImage(filename, bytes) {
      const { fs, path } = await node()
      const dir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, filename), bytes)
      return `/uploads/${filename}`
    },
  }
}

/**
 * Vercel Blob. The manifest lives beside the images as a plain JSON object, so
 * there is no database to provision, pay for, or keep awake. A few hundred
 * memories is a few hundred KB of JSON, read once per page load.
 */
function blobDriver(): StorageDriver {
  return {
    async readManifest() {
      const { list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: MANIFEST, limit: 1 })
      if (blobs.length === 0) {
        await this.writeManifest(SEED_MEMORIES)
        return SEED_MEMORIES
      }
      const res = await fetch(blobs[0].url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Could not read manifest: ${res.status}`)
      return (await res.json()) as Memory[]
    },

    async writeManifest(memories) {
      const { put } = await import('@vercel/blob')
      await put(MANIFEST, JSON.stringify(memories, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
      })
    },

    async saveImage(filename, bytes, contentType) {
      const { put } = await import('@vercel/blob')
      const { url } = await put(`memories/${filename}`, bytes, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
      })
      return url
    },
  }
}

export function getStorage(): StorageDriver {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobDriver() : localDriver()
}

/**
 * Serialized read-modify-write of the manifest. Every writer goes through
 * here, so two edits in flight on the same instance can't interleave and
 * erase each other's changes. Cross-instance races remain last-write-wins
 * (documented, acceptable at two users), but this closes the realistic
 * paths: sequential imports, a cover change during an import, dev.
 *
 * `mutate` returns the next manifest, or null to abort without writing.
 */
let manifestChain: Promise<unknown> = Promise.resolve()

export function updateManifest(
  mutate: (memories: Memory[]) => Memory[] | null,
): Promise<Memory[] | null> {
  const run = manifestChain.then(async () => {
    const storage = getStorage()
    const memories = await storage.readManifest()
    const next = mutate(memories)
    if (next !== null) await storage.writeManifest(next)
    return next
  })
  // The chain must survive a rejected run, or one failure wedges all writes.
  manifestChain = run.catch(() => undefined)
  return run
}

/**
 * Only images this app itself stored may appear in the album. Without this,
 * anyone with the password could persist arbitrary external URLs — and the
 * next/image allowlist (`*.public.blob.vercel-storage.com`) matches every
 * Vercel Blob customer's store, not just ours.
 */
export function isOwnSrc(src: string): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return /^\/uploads\/[A-Za-z0-9._-]+$/.test(src)
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return false
    // Token shape: vercel_blob_rw_<STOREID>_<secret> → store hostname is
    // <storeid>.public.blob.vercel-storage.com. If the shape ever changes,
    // fall back to the suffix check rather than locking ourselves out.
    const match = token.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)
    if (match) {
      return url.hostname === `${match[1].toLowerCase()}.public.blob.vercel-storage.com`
    }
    return url.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}
