'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Memory } from '@/lib/photos'

interface LightboxProps {
  memory: Memory | null
  onClose: () => void
}

export default function Lightbox({ memory, onClose }: LightboxProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const count = memory?.photos.length ?? 0

  const go = useCallback(
    (delta: number) => setIndex((i) => (count === 0 ? 0 : (i + delta + count) % count)),
    [count],
  )

  useEffect(() => setIndex(0), [memory?.id])

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
        <button onClick={onClose} aria-label="Close gallery" style={iconButton}>
          ×
        </button>
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
