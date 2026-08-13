'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, formatDate, type Memory, type PhotoCategory } from '@/lib/photos'
import { compressImage, reverseGeocode } from '@/lib/client-image'
import { buildDrafts, coordsOf, UNDATED, type Draft } from '@/lib/grouping'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  /** Every memory already in the album, so same-day imports can join them. */
  existing: Memory[]
  /** New and updated memories alike; the page upserts by id. */
  onImported: (memories: Memory[]) => void
}

type Phase = 'password' | 'pick' | 'reading' | 'review' | 'uploading'

export default function ImportModal({
  isOpen,
  onClose,
  existing,
  onImported,
}: ImportModalProps) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [password, setPassword] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [read, setRead] = useState({ done: 0, total: 0 })
  const [sent, setSent] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const objectUrls = useRef<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setPhase(d.authenticated ? 'pick' : 'password'))
      .catch(() => setPhase('password'))
  }, [isOpen])

  useEffect(() => {
    return () => {
      objectUrls.current.forEach(URL.revokeObjectURL)
      objectUrls.current = []
    }
  }, [])

  const close = () => {
    objectUrls.current.forEach(URL.revokeObjectURL)
    objectUrls.current = []
    setDrafts([])
    setError(null)
    setPhase('pick')
    onClose()
  }

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setPassword('')
      setPhase('pick')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not sign in.')
    }
  }

  const pick = async (files: FileList) => {
    setError(null)
    setPhase('reading')
    setRead({ done: 0, total: files.length })

    const built = await buildDrafts([...files], (done, total) => setRead({ done, total }))
    objectUrls.current.push(...built.flatMap((d) => d.files.map((f) => f.previewUrl)))

    // A day that matches exactly one existing memory defaults to joining it —
    // that is almost always what "more photos from that day" means. Ambiguous
    // days (two memories share the date) default to a new memory instead.
    for (const draft of built) {
      const matches = existing.filter((m) => m.takenAt === draft.key)
      if (matches.length === 1) draft.mergeTargetId = matches[0].id
    }

    setDrafts(built)
    setPhase('review')

    // Resolve place names one at a time. OpenStreetMap asks for no more than a
    // request per second, and the user is busy writing descriptions anyway.
    for (const draft of built) {
      const coords = coordsOf(draft)
      if (!coords) continue
      const place = await reverseGeocode(coords.lat, coords.lng)
      if (place) {
        setDrafts((prev) =>
          prev.map((d) => (d.key === draft.key && !d.location ? { ...d, location: place } : d)),
        )
      }
      await new Promise((r) => setTimeout(r, 1100))
    }
  }

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const submit = async () => {
    const chosen = drafts.filter((d) => d.include)
    if (chosen.length === 0) {
      setError('Nothing selected to import.')
      return
    }
    const missing = chosen.find(
      (d) =>
        !d.mergeTargetId &&
        (!d.title || !d.location || !d.description || !d.takenAt),
    )
    if (missing) {
      setError(
        `"${missing.key === UNDATED ? 'Undated photos' : formatDate(missing.key)}" still needs a title, location, date and description.`,
      )
      return
    }

    setError(null)
    setPhase('uploading')
    const totalPhotos = chosen.reduce((n, d) => n + d.files.length, 0)
    setSent({ done: 0, total: totalPhotos })

    const created: Memory[] = []
    let done = 0

    try {
      for (const draft of chosen) {
        const uploaded: { src: string; takenAt?: string; lat?: number; lng?: number }[] = []

        for (const item of draft.files) {
          const compressed = await compressImage(item.file).catch(() => {
            throw new Error(
              `${item.file.name} could not be read. JPEG and PNG both work.`,
            )
          })
          const body = new FormData()
          body.append('file', compressed)

          const res = await fetch('/api/upload', { method: 'POST', body })
          if (res.status === 401) {
            setPhase('password')
            throw new Error('Please enter the password again.')
          }
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error ?? 'A photo failed to upload.')

          uploaded.push({
            src: data.src,
            takenAt: item.takenAt,
            lat: item.lat,
            lng: item.lng,
          })
          done += 1
          setSent({ done, total: totalPhotos })
        }

        const res = draft.mergeTargetId
          ? await fetch(`/api/memories/${draft.mergeTargetId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ addPhotos: uploaded }),
            })
          : await fetch('/api/memories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: draft.title,
                location: draft.location,
                description: draft.description,
                takenAt: draft.takenAt,
                category: draft.category,
                photos: uploaded,
              }),
            })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not save the memory.')
        created.push(data.memory as Memory)
        // This draft is committed server-side. Drop it from state so a retry
        // after a later failure re-runs only what actually failed — otherwise
        // every retry would re-add these photos to the album.
        setDrafts((prev) => prev.filter((d) => d.key !== draft.key))
      }

      onImported(created)
      close()
    } catch (err) {
      // Days that committed before the failure are real — show them on the
      // page now rather than leaving it stale until a reload.
      if (created.length > 0) onImported(created)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      // Functional read: the 401 path just queued setPhase('password'), and
      // the closure's stale `phase` must not clobber it back to review.
      setPhase((p) => (p === 'password' ? p : 'review'))
    }
  }

  if (!isOpen) return null

  // Closing mid-upload would leave the submit loop writing to the album with
  // no progress UI — and reopening could start a second, racing import.
  const safeClose = phase === 'uploading' ? undefined : close

  const photoCount = drafts.reduce((n, d) => n + (d.include ? d.files.length : 0), 0)
  const dayCount = drafts.filter((d) => d.include).length
  const newCount = drafts.filter((d) => d.include && !d.mergeTargetId).length
  const mergeCount = dayCount - newCount
  const submitLabel = [
    newCount > 0 ? `Add ${newCount} ${newCount === 1 ? 'memory' : 'memories'}` : '',
    mergeCount > 0
      ? `${newCount > 0 ? 'add' : 'Add'} photos to ${mergeCount} existing`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div style={overlay} onClick={safeClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={headerRow}>
          <h2 style={{ fontSize: '24px', margin: 0 }}>
            {phase === 'review' ? `${dayCount} days, ${photoCount} photos` : 'Add Memories'}
          </h2>
          <button
            onClick={safeClose}
            aria-label="Close"
            disabled={phase === 'uploading'}
            style={{ ...closeButton, opacity: phase === 'uploading' ? 0.3 : 1 }}
          >
            ×
          </button>
        </div>

        {phase === 'password' && (
          <form onSubmit={unlock}>
            <p style={{ fontSize: '15px', color: '#666', marginTop: 0 }}>
              Enter the password to add memories.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              placeholder="Password"
              autoFocus
            />
            {error && <p style={errorText}>{error}</p>}
            <button type="submit" style={{ ...primary, marginTop: '16px' }}>
              Unlock
            </button>
          </form>
        )}

        {phase === 'pick' && (
          <>
            <p style={{ fontSize: '15px', color: '#666', marginTop: 0, lineHeight: 1.6 }}>
              Choose as many photos as you like. They&apos;ll be grouped by the day they
              were taken, so you only write one description per day.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files?.length && pick(e.target.files)}
              style={{ ...input, padding: '8px' }}
            />
            {error && <p style={errorText}>{error}</p>}
          </>
        )}

        {phase === 'reading' && (
          <>
            <p style={{ fontSize: '15px', color: '#666' }}>
              Reading {read.done} of {read.total} photos…
            </p>
            <Bar value={read.done} max={read.total} />
          </>
        )}

        {phase === 'uploading' && (
          <>
            <p style={{ fontSize: '15px', color: '#666' }}>
              Uploading {sent.done} of {sent.total} photos…
            </p>
            <Bar value={sent.done} max={sent.total} />
            <p style={{ fontSize: '13px', color: '#999' }}>
              Keep this window open until it finishes.
            </p>
          </>
        )}

        {phase === 'review' && (
          <>
            <p style={{ fontSize: '14px', color: '#666', marginTop: 0 }}>
              Each card below becomes one memory. Untick any day you don&apos;t want.
            </p>

            {drafts.map((draft) => (
              <DraftCard
                key={draft.key}
                draft={draft}
                candidates={existing.filter((m) => m.takenAt === draft.key)}
                onChange={update}
              />
            ))}

            {error && <p style={errorText}>{error}</p>}

            <button onClick={submit} style={{ ...primary, marginTop: '8px' }}>
              {submitLabel || 'Nothing selected'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      style={{ height: '6px', background: '#eee', borderRadius: '999px', overflow: 'hidden' }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${pct}%`, height: '100%', background: '#333' }} />
    </div>
  )
}

function DraftCard({
  draft,
  candidates,
  onChange,
}: {
  draft: Draft
  /** Existing memories from this same day, offered as merge targets. */
  candidates: Memory[]
  onChange: (key: string, patch: Partial<Draft>) => void
}) {
  const undated = draft.key === UNDATED
  const mergeTarget = candidates.find((m) => m.id === draft.mergeTargetId)
  return (
    <div
      style={{
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        opacity: draft.include ? 1 : 0.5,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '15px' }}>
          {undated ? 'Photos with no date' : formatDate(draft.key)}
          <span style={{ fontWeight: 400, color: '#888' }}>
            {' '}
            · {draft.files.length} {draft.files.length === 1 ? 'photo' : 'photos'}
          </span>
        </strong>
        <label style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '6px' }}>
          <input
            type="checkbox"
            checked={draft.include}
            onChange={(e) => onChange(draft.key, { include: e.target.checked })}
          />
          Include
        </label>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '12px 0' }}>
        {draft.files.slice(0, 12).map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={f.previewUrl}
            alt=""
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'cover',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          />
        ))}
        {draft.files.length > 12 && (
          <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>
            +{draft.files.length - 12}
          </span>
        )}
      </div>

      {draft.include && candidates.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
            You already have {candidates.length === 1 ? 'a memory' : 'memories'} from this
            day
          </label>
          <select
            value={draft.mergeTargetId ?? ''}
            onChange={(e) =>
              onChange(draft.key, { mergeTargetId: e.target.value || undefined })
            }
            style={input}
          >
            <option value="">Create a new, separate memory</option>
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                Add these photos to &ldquo;{m.title}&rdquo;
              </option>
            ))}
          </select>
        </div>
      )}

      {draft.include && mergeTarget && (
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>
          {draft.files.length === 1 ? 'This photo joins' : 'These photos join'}{' '}
          <strong>&ldquo;{mergeTarget.title}&rdquo;</strong> — they share its story, so
          there&apos;s nothing more to write.
        </p>
      )}

      {draft.include && !mergeTarget && (
        <>
          {undated && (
            <input
              type="date"
              value={draft.takenAt}
              onChange={(e) => onChange(draft.key, { takenAt: e.target.value })}
              style={{ ...input, marginBottom: '8px' }}
            />
          )}
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onChange(draft.key, { title: e.target.value })}
            style={{ ...input, marginBottom: '8px' }}
            placeholder="What was this day?"
          />
          <input
            type="text"
            value={draft.location}
            onChange={(e) => onChange(draft.key, { location: e.target.value })}
            style={{ ...input, marginBottom: '8px' }}
            placeholder="Where were you?"
          />
          <textarea
            value={draft.description}
            onChange={(e) => onChange(draft.key, { description: e.target.value })}
            rows={3}
            style={{ ...input, marginBottom: '8px', height: '84px', resize: 'vertical' }}
            placeholder="What made it special?"
          />
          <select
            value={draft.category}
            onChange={(e) =>
              onChange(draft.key, { category: e.target.value as PhotoCategory })
            }
            style={input}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

const overlay: React.CSSProperties = {
  display: 'flex',
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  zIndex: 1000,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
}

const panel: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '28px',
  borderRadius: '10px',
  width: '100%',
  maxWidth: '640px',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
}

const closeButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  lineHeight: 1,
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '16px',
  boxSizing: 'border-box',
}

const errorText: React.CSSProperties = {
  color: '#c0392b',
  fontSize: '14px',
  marginBottom: '12px',
}

const primary: React.CSSProperties = {
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '16px',
}
