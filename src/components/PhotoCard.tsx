'use client'

import React from 'react'
import Image from 'next/image'
import { coverOf, mapsUrl, type Memory } from '@/lib/photos'

interface PhotoCardProps {
  memory: Memory
  onOpen: (memory: Memory) => void
}

export default function PhotoCard({ memory, onOpen }: PhotoCardProps) {
  const cover = coverOf(memory)
  const extra = memory.photos.length - 1

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
      }}
    >
      <button
        onClick={() => onOpen(memory)}
        aria-label={`Open ${memory.title}${extra > 0 ? `, ${memory.photos.length} photos` : ''}`}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '300px',
          padding: 0,
          border: 'none',
          background: '#eee',
          cursor: 'pointer',
        }}
      >
        {cover && (
          <Image
            src={cover.src}
            alt={memory.title}
            fill
            sizes="(max-width: 700px) 100vw, 400px"
            style={{ objectFit: 'cover' }}
          />
        )}
        {extra > 0 && (
          <span
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '13px',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            +{extra} more
          </span>
        )}
      </button>

      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '20px', margin: '0 0 10px 0', color: '#333' }}>
          {memory.title}
        </h3>

        <a
          href={mapsUrl(memory)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '14px',
            color: '#888',
            marginBottom: '8px',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
          }}
        >
          📍 {memory.location}
        </a>

        <p style={{ fontSize: '14px', color: '#777', marginBottom: '15px' }}>{memory.date}</p>

        <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#555' }}>
          {memory.description}
        </p>
      </div>
    </div>
  )
}
