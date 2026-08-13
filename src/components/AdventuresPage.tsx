'use client'

import React, { useEffect, useState } from 'react'
import Header from './Header'
import FeaturedMemory from './FeaturedMemory'
import PhotoGrid from './PhotoGrid'
import ImportModal from './ImportModal'
import Lightbox from './Lightbox'
import Footer from './Footer'
import { byDate, type Memory } from '@/lib/photos'
import { FEATURED_ID } from '@/data/seed-memories'

export type { Memory } from '@/lib/photos'

export default function AdventuresPage() {
  const [memories, setMemories] = useState<Memory[] | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isImportOpen, setImportOpen] = useState(false)
  const [viewing, setViewing] = useState<Memory | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch('/api/memories')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((d) => setMemories(d.memories as Memory[]))
      .catch(() => setLoadError(true))
  }, [])

  const handleImported = (added: Memory[]) => {
    setMemories((prev) => byDate([...(prev ?? []), ...added]))
  }

  const featured = memories?.find((m) => m.id === FEATURED_ID)
  const rest = memories?.filter((m) => m.id !== FEATURED_ID) ?? []
  const filtered =
    activeCategory === 'all'
      ? rest
      : rest.filter((memory) => memory.category === activeCategory)

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        margin: 0,
        padding: 0,
        color: '#333',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
      }}
    >
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
        {featured && <FeaturedMemory memory={featured} onOpen={setViewing} />}

        {memories === null && !loadError && (
          <p style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>
            Loading our memories…
          </p>
        )}

        {loadError && (
          <p style={{ padding: '60px 0', textAlign: 'center', color: '#c0392b' }}>
            Could not load the album. Try refreshing?
          </p>
        )}

        {memories !== null && (
          <PhotoGrid
            memories={filtered}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            availableCategories={rest.map((m) => m.category)}
            onOpen={setViewing}
          />
        )}
      </div>

      <Footer />

      <button
        onClick={() => setImportOpen(true)}
        aria-label="Add memories"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          cursor: 'pointer',
        }}
      >
        +
      </button>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />

      <Lightbox memory={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
