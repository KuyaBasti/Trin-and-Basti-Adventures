import React from 'react'
import Image from 'next/image'
import { Photo } from './AdventuresPage'

interface PhotoCardProps {
  photo: Photo
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={400}
        height={300}
        style={{
          width: '100%',
          height: '300px',
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#eee'
        }}
      />
      
      <div style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '20px',
          margin: '0 0 10px 0',
          color: '#333'
        }}>
          {photo.title}
        </h3>
        
        <div
          onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(photo.location)}`, '_blank')}
          style={{
            fontSize: '14px',
            color: '#888',
            marginBottom: '8px',
            cursor: 'pointer',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
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