import React from 'react'
import PhotoCard from './PhotoCard'
import { type Memory } from '@/lib/photos'

interface PhotoGridProps {
  memories: Memory[]
  onOpen: (memory: Memory) => void
}

export default function PhotoGrid({ memories, onOpen }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:gap-[30px] sm:pb-10 sm:pt-[30px]">
      {memories.map((memory) => (
        <PhotoCard key={memory.id} memory={memory} onOpen={onOpen} />
      ))}
    </div>
  )
}
