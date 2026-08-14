'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CATEGORIES, coverOf, type Memory, type PhotoCategory } from '@/lib/photos'

interface LightboxProps {
  memory: Memory | null
  onClose: () => void
  /** Called with the fresh memory after an edit (cover, text, photos). */
  onUpdated: (memory: Memory) => void
  /** Called after the memory is deleted server-side. */
  onDeleted: (id: string) => void
}

export default function Lightbox({ memory, onClose, onUpdated, onDeleted }: LightboxProps) {
  const [index, setIndex] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const [coverState, setCoverState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [removeState, setRemoveState] = useState<'idle' | 'confirm' | 'saving' | 'error'>(
    'idle',
  )
  const [editing, setEditing] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const removingId = useRef<string | null>(null)
  const shownPhotoId = useRef<string | null>(null)

  const count = memory?.photos.length ?? 0

  const go = useCallback(
    (delta: number) => setIndex((i) => (count === 0 ? 0 : (i + delta + count) % count)),
    [count],
  )

  useEffect(() => setIndex(0), [memory?.id])
  useEffect(() => {
    setCoverState('idle')
    // A removal in flight keeps its indicator; anything else resets when the
    // viewer navigates away.
    setRemoveState((s) => (s === 'saving' ? s : 'idle'))
  }, [index, memory?.id])
  useEffect(() => setEditing(false), [memory?.id])
  // Removing a photo can shrink the list under the current position.
  useEffect(() => {
    if (count > 0 && index >= count) setIndex(count - 1)
  }, [count, index])

  // Editing chrome only appears for someone who has already unlocked
  // uploads on this device; viewers never see it.
  useEffect(() => {
    if (!memory) return
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setCanEdit(Boolean(d.authenticated)))
      .catch(() => setCanEdit(false))
  }, [memory?.id])

  useEffect(() => {
    if (!memory) return
    const onKey = (e: KeyboardEvent) => {
      if (editing) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    // Stop the page behind from scrolling while the gallery is open.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [memory, go, onClose, editing])

  const patch = async (body: Record<string, unknown>) => {
    if (!memory) throw new Error('No memory open.')
    const res = await fetch(`/api/memories/${memory.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Could not save.')
    onUpdated(data.memory as Memory)
    return data.memory as Memory
  }

  const makeCover = async () => {
    if (!memory) return
    const photo = memory.photos[Math.min(index, count - 1)]
    if (!photo) return
    setCoverState('saving')
    try {
      await patch({ coverId: photo.id })
      setCoverState('idle')
    } catch {
      setCoverState('error')
    }
  }

  const removePhoto = async () => {
    if (!memory) return
    const photo = memory.photos[Math.min(index, count - 1)]
    if (!photo) return
    removingId.current = photo.id
    setRemoveState('saving')
    try {
      await patch({ removePhotoIds: [photo.id] })
      removingId.current = null
      setRemoveState('idle')
    } catch {
      // Surface the error only if the viewer is still on the photo whose
      // removal failed; an error chip on an unrelated photo misleads.
      setRemoveState(shownPhotoId.current === removingId.current ? 'error' : 'idle')
      removingId.current = null
    }
  }

  if (!memory) return null
  // Clamp at render time: the effect-based clamp runs a frame later, and a
  // removal of the last photo must not blank the whole gallery for a frame.
  const shown = Math.min(index, count - 1)
  const photo = memory.photos[shown]
  if (!photo) return null
  shownPhotoId.current = photo.id
  const cover = coverOf(memory)
  const isCover = cover?.id === photo.id

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.94)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => {
        // Never discard unsaved edits via a stray background click.
        if (!editing) onClose()
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        if (start == null) return
        const delta = e.changedTouches[0].clientX - start
        if (Math.abs(delta) > 50 && !editing) go(delta < 0 ? 1 : -1)
        touchStartX.current = null
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          color: '#fff',
          gap: '12px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {memory.title}
          </div>
          <div style={{ fontSize: '13px', color: '#aaa' }}>
            {count > 1 ? `${shown + 1} of ${count} · ` : ''}
            {memory.date}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {canEdit && !editing && (
            <>
              {count > 1 && !isCover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    makeCover()
                  }}
                  disabled={coverState === 'saving'}
                  style={chipButton(coverState === 'saving')}
                >
                  {coverState === 'saving'
                    ? 'Saving…'
                    : coverState === 'error'
                      ? "Couldn't save — retry?"
                      : 'Make this the cover'}
                </button>
              )}
              {count > 1 && isCover && (
                <span style={{ fontSize: '13px', color: '#aaa' }}>Cover photo</span>
              )}
              {count > 1 &&
                (removeState === 'confirm' ? (
                  <span
                    style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontSize: '13px', color: '#f0a0a0' }}>
                      Remove this photo?
                    </span>
                    <button onClick={removePhoto} style={chipButton(false, '#8c2f2f')}>
                      Yes, remove
                    </button>
                    <button onClick={() => setRemoveState('idle')} style={chipButton(false)}>
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemoveState('confirm')
                    }}
                    disabled={removeState === 'saving'}
                    style={chipButton(removeState === 'saving')}
                  >
                    {removeState === 'saving'
                      ? 'Removing…'
                      : removeState === 'error'
                        ? "Couldn't remove — retry?"
                        : 'Remove photo'}
                  </button>
                ))}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(true)
                }}
                style={chipButton(false)}
              >
                Edit
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (!editing) onClose()
            }}
            aria-label="Close gallery"
            style={{ ...iconButton, opacity: editing ? 0.3 : 1 }}
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={photo.id}
          src={photo.src}
          alt={memory.title}
          fill
          sizes="100vw"
          style={{ objectFit: 'contain' }}
          priority
        />

        {count > 1 && !editing && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              style={{ ...navButton, left: '10px' }}
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              style={{ ...navButton, right: '10px' }}
            >
              ›
            </button>
          </>
        )}

        {editing && (
          <EditPanel
            memory={memory}
            onCancel={() => setEditing(false)}
            onSave={async (fields) => {
              // Send only what actually changed: a save from a stale view must
              // not revert fields the user never touched (the other person may
              // have edited them meanwhile), and an all-unchanged save is a
              // no-op, not a 400.
              const dirty: Record<string, unknown> = {}
              for (const key of Object.keys(fields) as (keyof EditFields)[]) {
                if (fields[key] !== memory[key]) dirty[key] = fields[key]
              }
              if (Object.keys(dirty).length > 0) await patch(dirty)
              setEditing(false)
            }}
            onDelete={async () => {
              const res = await fetch(`/api/memories/${memory.id}`, { method: 'DELETE' })
              const data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error(data.error ?? 'Could not delete.')
              onDeleted(memory.id)
              onClose()
            }}
          />
        )}
      </div>

      {count > 1 && !editing && (
        <div
          style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 18px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {memory.photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === shown}
              style={{
                position: 'relative',
                border: i === shown ? '2px solid #fff' : '2px solid transparent',
                borderRadius: '4px',
                padding: 0,
                width: '56px',
                height: '56px',
                flexShrink: 0,
                cursor: 'pointer',
                background: '#222',
                overflow: 'hidden',
              }}
            >
              <Image
                src={p.src}
                alt=""
                width={56}
                height={56}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {p.id === cover?.id && (
                <span
                  aria-label="Cover photo"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    fontSize: '11px',
                    lineHeight: 1,
                    textShadow: '0 0 3px rgba(0,0,0,0.9)',
                  }}
                >
                  ★
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface EditFields {
  title: string
  location: string
  takenAt: string
  description: string
  category: PhotoCategory
}

function EditPanel({
  memory,
  onCancel,
  onSave,
  onDelete,
}: {
  memory: Memory
  onCancel: () => void
  onSave: (fields: EditFields) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [fields, setFields] = useState<EditFields>({
    title: memory.title,
    location: memory.location,
    takenAt: memory.takenAt,
    description: memory.description,
    category: memory.category,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const save = async () => {
    setError(null)
    if (!fields.title.trim() || !fields.location.trim() || !fields.description.trim()) {
      setError('Title, location and description all need something in them.')
      return
    }
    setBusy(true)
    try {
      await onSave(fields)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
      setBusy(false)
    }
  }

  const destroy = async () => {
    setError(null)
    setBusy(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.')
      setBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        padding: '16px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: '#1c1c1c',
          border: '1px solid #333',
          borderRadius: '10px',
          padding: '22px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '100%',
          overflowY: 'auto',
          color: '#eee',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Edit this memory</h3>

        <label style={editLabel}>Title</label>
        <input
          type="text"
          value={fields.title}
          onChange={(e) => setFields({ ...fields, title: e.target.value })}
          style={editInput}
        />
        <label style={editLabel}>Location</label>
        <input
          type="text"
          value={fields.location}
          onChange={(e) => setFields({ ...fields, location: e.target.value })}
          style={editInput}
        />
        <label style={editLabel}>Date</label>
        <input
          type="date"
          value={fields.takenAt}
          onChange={(e) => setFields({ ...fields, takenAt: e.target.value })}
          style={editInput}
        />
        <label style={editLabel}>Category</label>
        <select
          value={fields.category}
          onChange={(e) => setFields({ ...fields, category: e.target.value as PhotoCategory })}
          style={editInput}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label style={editLabel}>Description</label>
        <textarea
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
          rows={4}
          style={{ ...editInput, resize: 'vertical' }}
        />

        {error && (
          <p style={{ color: '#f0a0a0', fontSize: '13px', margin: '4px 0 10px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button onClick={save} disabled={busy} style={panelButton('#f0f0f0', '#111')}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onCancel} disabled={busy} style={panelButton('transparent', '#ccc')}>
            Cancel
          </button>
        </div>

        <div style={{ borderTop: '1px solid #333', marginTop: '18px', paddingTop: '14px' }}>
          {confirmingDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#f0a0a0' }}>
                Delete &ldquo;{memory.title}&rdquo; and its{' '}
                {memory.photos.length === 1 ? 'photo' : `${memory.photos.length} photos`}{' '}
                forever?
              </span>
              <button onClick={destroy} disabled={busy} style={panelButton('#8c2f2f', '#fff')}>
                {busy ? 'Deleting…' : 'Yes, delete it'}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                style={panelButton('transparent', '#ccc')}
              >
                Keep it
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              style={panelButton('transparent', '#e08080')}
            >
              Delete this memory…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const chipButton = (busy: boolean, bg = 'rgba(255,255,255,0.14)'): React.CSSProperties => ({
  background: bg,
  border: '1px solid rgba(255,255,255,0.35)',
  color: '#fff',
  fontSize: '13px',
  padding: '6px 12px',
  borderRadius: '999px',
  cursor: 'pointer',
  opacity: busy ? 0.6 : 1,
})

const iconButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '30px',
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
}

const navButton: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.45)',
  border: 'none',
  color: '#fff',
  fontSize: '34px',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  cursor: 'pointer',
  lineHeight: 1,
}

const editLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#999',
  margin: '10px 0 4px',
}

const editInput: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: '6px',
  border: '1px solid #444',
  background: '#111',
  color: '#eee',
  fontSize: '15px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const panelButton = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  border: bg === 'transparent' ? '1px solid #444' : 'none',
  padding: '9px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
})
