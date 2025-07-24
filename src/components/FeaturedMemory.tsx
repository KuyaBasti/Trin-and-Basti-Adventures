import React from 'react'
import Image from 'next/image'
import { Photo } from './AdventuresPage'

interface FeaturedMemoryProps {
  photo: Photo
}

export default function FeaturedMemory({ photo }: FeaturedMemoryProps) {
  return (
    <div style={{
      margin: '20px 0 40px 0',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
    }}>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={1200}
        height={500}
        style={{
          width: '100%',
          maxHeight: '500px',
          objectFit: 'cover',
          backgroundColor: '#eee'
        }}
        priority
      />
      
      <div style={{ padding: '30px' }}>
        <h2 style={{
          fontSize: '32px',
          margin: '0 0 15px 0',
          color: '#333'
        }}>
          {photo.title}
        </h2>
        
        <div
          onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(photo.location)}`, '_blank')}
          style={{
            fontSize: '16px',
            color: '#888',
            marginBottom: '10px',
            cursor: 'pointer',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#555'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888'
          }}
        >
          📍 {photo.location}
        </div>
        
        <p style={{
          fontSize: '14px',
          color: '#777',
          marginBottom: '15px'
        }}>
          {photo.date}
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#555'
        }}>
          {photo.description}
        </p>
      </div>
    </div>
  )
} 