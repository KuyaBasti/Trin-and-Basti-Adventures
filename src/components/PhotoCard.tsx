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
    <div className="overflow-hidden rounded-lg bg-white shadow-[0_3px_10px_rgba(0,0,0,0.1)]">
      <button
        onClick={() => onOpen(memory)}
        aria-label={`Open ${memory.title}${extra > 0 ? `, ${memory.photos.length} photos` : ''}`}
        className="relative block h-[240px] w-full cursor-pointer border-none bg-[#eee] p-0 sm:h-[300px]"
      >
        {cover && (
          <Image
            src={cover.src}
            alt={memory.title}
            fill
            sizes="(max-width: 700px) 100vw, 400px"
            className="object-cover"
          />
        )}
        {extra > 0 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[13px] text-white">
            +{extra} more
          </span>
        )}
      </button>

      <div className="p-4 sm:p-5">
        <h3 className="mb-2.5 mt-0 text-[18px] text-[#333] sm:text-[20px]">
          {memory.title}
        </h3>

        <a
          href={mapsUrl(memory)}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-1 text-[14px] italic text-[#888] no-underline"
        >
          📍 {memory.location}
        </a>

        <p className="mb-3 text-[14px] text-[#777] sm:mb-[15px]">{memory.date}</p>

        <p className="text-[16px] leading-normal text-[#555]">{memory.description}</p>
      </div>
    </div>
  )
}
