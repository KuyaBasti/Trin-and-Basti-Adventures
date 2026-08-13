'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { coverOf, type Memory } from '@/lib/photos'

interface LightboxProps {
  memory: Memory | null
  onClose: () => void
  /** Called with the fresh memory after an edit (e.g. a new cover). */
  onUpdated: (memory: Memory) => void
}

export default function Lightbox({ memory, onClose, onUpdated }: LightboxProps) {
  const [index, setIndex] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const [coverState, setCoverState] = useState<'idle' | 'saving' | 'error'>('idle')
  const touchStartX = useRef<number | null>(null)

  const count = memory?.photos.length ?? 0

  // The cover button only appears for someone who has already unlocked
  // uploads on this device; viewers never see editing chrome.
  useEffect(() => {
    if (!memory) return
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setCanEdit(Boolean(d.authenticated)))
      .catch(() => setCanEdit(false))
  }, [memory?.id])

  const makeCover = async () => {
    if (!memory) return
    const photo = memory.photos[index]
    if (!photo) return
    setCoverState('saving')
    try {
      const res = await fetch(`/api/memories/${memory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverId: photo.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not save.')
      onUpdated(data.memory as Memory)
      setCoverState('idle')
    } catch {
      setCoverState('error')
    }
  }

  const go = useCallback(
    (delta: number) => setIndex((i) => (count === 0 ? 0 : (i + delta + count) % count)),
    [count],
  )

  useEffect(() => setIndex(0), [memory?.id])
  useEffect(() => setCoverState('idle'), [index, memory?.id])

  useEffect(() => {
    if (!memory) return
    const onKey = (e: KeyboardEvent) => {
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
  }, [memory, go, onClose])

  if (!memory) return null
  const photo = memory.photos[index]
  if (!photo) return null
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
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        if (start == null) return
        const delta = e.changedTouches[0].clientX - start
        if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1)
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
            {count > 1 ? `${index + 1} of ${count} · ` : ''}
            {memory.date}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {canEdit && count > 1 && !isCover && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                makeCover()
              }}
              disabled={coverState === 'saving'}
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '999px',
                cursor: 'pointer',
                opacity: coverState === 'saving' ? 0.6 : 1,
              }}
            >
              {coverState === 'saving'
                ? 'Saving…'
                : coverState === 'error'
                  ? "Couldn't save — retry?"
                  : 'Make this the cover'}
            </button>
          )}
          {canEdit && count > 1 && isCover && (
            <span style={{ fontSize: '13px', color: '#aaa' }}>Cover photo</span>
          )}
          <button onClick={onClose} aria-label="Close gallery" style={iconButton}>
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

        {count > 1 && (
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
      </div>

      {count > 1 && (
        <div
          style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 18px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {memory.photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              style={{
                position: 'relative',
                border: i === index ? '2px solid #fff' : '2px solid transparent',
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
