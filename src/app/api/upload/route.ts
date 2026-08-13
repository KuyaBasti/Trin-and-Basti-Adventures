import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { hasSession } from '@/lib/auth'
import { getStorage } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// HEIC is deliberately absent: browsers can't render it, so storing one would
// produce a photo that never displays. The client re-encodes to JPEG first.
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Vercel caps serverless request bodies at 4.5MB. One compressed photo is well
 * under that; a whole memory's worth would not be, which is why images are
 * uploaded one per request and the memory is created separately afterwards.
 */
const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No photo was attached.' }, { status: 400 })
  }

  const extension = EXTENSIONS[file.type]
  if (!extension) {
    return NextResponse.json(
      { error: `${file.type || 'That file'} is not an image we can display.` },
      { status: 415 },
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'That photo is too large even after compression.' },
      { status: 413 },
    )
  }

  const id = randomUUID()
  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const src = await getStorage().saveImage(`${id}.${extension}`, bytes, file.type)
    return NextResponse.json({ id, src }, { status: 201 })
  } catch (error) {
    console.error('Failed to store image', error)
    return NextResponse.json({ error: 'Could not save the photo.' }, { status: 500 })
  }
}
