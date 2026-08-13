import React from 'react'
import PhotoCard from './PhotoCard'
import { CATEGORIES, type Memory, type PhotoCategory } from '@/lib/photos'

interface PhotoGridProps {
  memories: Memory[]
  activeCategory: string
  setActiveCategory: (category: string) => void
  /** Categories that actually contain memories. */
  availableCategories: PhotoCategory[]
  onOpen: (memory: Memory) => void
}

export default function PhotoGrid({
  memories,
  activeCategory,
  setActiveCategory,
  availableCategories,
  onOpen,
}: PhotoGridProps) {
  // Only offer filters that would return something.
  const shown = CATEGORIES.filter((c) => availableCategories.includes(c.value))
  const tabs = [{ value: 'all', label: 'All' }, ...shown]

  return (
    <>
      {shown.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            paddingTop: '10px',
          }}
        >
          {tabs.map((tab) => {
            const active = activeCategory === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                aria-pressed={active}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? '#333' : '#ddd'}`,
                  backgroundColor: active ? '#333' : '#fff',
                  color: active ? '#fff' : '#666',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          padding: '30px 0 40px',
        }}
      >
        {memories.map((memory) => (
          <PhotoCard key={memory.id} memory={memory} onOpen={onOpen} />
        ))}
      </div>
    </>
  )
}
