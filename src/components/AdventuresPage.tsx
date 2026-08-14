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

  // Upsert: an import can return brand-new memories and freshly-updated
  // existing ones (photos merged in); an edit returns one updated memory.
  const handleChanged = (changed: Memory[]) => {
    setMemories((prev) => {
      let next = prev ?? []
      for (const memory of changed) {
        next = next.some((m) => m.id === memory.id)
          ? next.map((m) => (m.id === memory.id ? memory : m))
          : [...next, memory]
      }
      return byDate(next)
    })
    // Keep an open gallery in sync with what it just changed.
    setViewing((v) => changed.find((m) => m.id === v?.id) ?? v)
  }

  const featured = memories?.find((m) => m.id === FEATURED_ID)
  const rest = memories?.filter((m) => m.id !== FEATURED_ID) ?? []
  const filtered =
    activeCategory === 'all'
      ? rest
      : rest.filter((memory) => memory.category === activeCategory)

  return (
    <div
      className="m-0 min-h-screen bg-[#f9f9f9] p-0 text-[#333]"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />

      <div className="mx-auto box-content max-w-[1200px] px-[15px]">
        {featured && <FeaturedMemory memory={featured} onOpen={setViewing} />}

        {memories === null && !loadError && (
          <p className="py-[60px] text-center text-[#999]">Loading our memories…</p>
        )}

        {loadError && (
          <p className="py-[60px] text-center text-[#c0392b]">
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

      {/* Hidden until the album has loaded: importing against unknown album
          state would skip merge detection and create duplicate days. */}
      {memories !== null && (
        <button
          onClick={() => setImportOpen(true)}
          aria-label="Add memories"
          className="fixed bottom-5 right-5 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-[#333] text-[28px] text-white shadow-[0_3px_10px_rgba(0,0,0,0.2)] sm:bottom-[30px] sm:right-[30px] sm:h-[60px] sm:w-[60px] sm:text-[30px]"
        >
          +
        </button>
      )}

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setImportOpen(false)}
        existing={memories ?? []}
        onImported={handleChanged}
      />

      <Lightbox
        memory={viewing}
        onClose={() => setViewing(null)}
        onUpdated={(m) => handleChanged([m])}
        onDeleted={(id) => {
          setMemories((prev) => (prev ?? []).filter((m) => m.id !== id))
          setViewing((v) => (v?.id === id ? null : v))
        }}
      />
    </div>
  )
}
