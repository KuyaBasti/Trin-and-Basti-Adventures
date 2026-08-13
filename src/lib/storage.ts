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
