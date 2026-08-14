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
        <div className="flex flex-wrap justify-center gap-2 pt-2.5 sm:gap-2.5">
          {tabs.map((tab) => {
            const active = activeCategory === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-4 py-2 font-[inherit] text-[13px] sm:px-[18px] sm:text-[14px] ${
                  active
                    ? 'border-[#333] bg-[#333] text-white'
                    : 'border-[#ddd] bg-white text-[#666]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:gap-[30px] sm:pb-10 sm:pt-[30px]">
        {memories.map((memory) => (
          <PhotoCard key={memory.id} memory={memory} onOpen={onOpen} />
        ))}
      </div>
    </>
  )
}
