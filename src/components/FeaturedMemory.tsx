'use client'

import React from 'react'
import Image from 'next/image'
import { coverOf, mapsUrl, type Memory } from '@/lib/photos'

interface FeaturedMemoryProps {
  memory: Memory
  onOpen: (memory: Memory) => void
}

export default function FeaturedMemory({ memory, onOpen }: FeaturedMemoryProps) {
  const cover = coverOf(memory)
  const extra = memory.photos.length - 1

  return (
    <div
      style={{
        margin: '20px 0 40px 0',
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      }}
    >
      <button
        onClick={() => onOpen(memory)}
        aria-label={`Open ${memory.title}`}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '500px',
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
            sizes="(max-width: 1200px) 100vw, 1200px"
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        {extra > 0 && (
          <span
            style={{
              position: 'absolute',
              right: '14px',
              bottom: '14px',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '999px',
            }}
          >
            +{extra} more
          </span>
        )}
      </button>

      <div style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '32px', margin: '0 0 15px 0', color: '#333' }}>
          {memory.title}
        </h2>

        <a
          href={mapsUrl(memory)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '16px',
            color: '#888',
            marginBottom: '10px',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
