import React from 'react'
import PhotoCard from './PhotoCard'
import { Photo } from './AdventuresPage'

interface PhotoGridProps {
  photos: Photo[]
  activeCategory: string
  setActiveCategory: (category: string) => void
}

export default function PhotoGrid({ photos, activeCategory, setActiveCategory }: PhotoGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '30px',
      padding: '40px 0'
    }}>
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  )
} 