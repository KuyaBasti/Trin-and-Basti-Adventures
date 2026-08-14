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
    <div className="mb-8 mt-5 overflow-hidden rounded-xl bg-white shadow-[0_5px_15px_rgba(0,0,0,0.1)] sm:mb-10">
      <button
        onClick={() => onOpen(memory)}
        aria-label={`Open ${memory.title}`}
        className="relative block h-[260px] w-full cursor-pointer border-none bg-[#eee] p-0 sm:h-[400px] lg:h-[500px]"
      >
        {cover && (
          <Image
            src={cover.src}
            alt={memory.title}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
            priority
          />
        )}
        {extra > 0 && (
          <span className="absolute bottom-3.5 right-3.5 rounded-full bg-black/60 px-3 py-1.5 text-[14px] text-white">
            +{extra} more
          </span>
        )}
      </button>

      <div className="p-5 sm:p-[30px]">
        <h2 className="mb-3 mt-0 text-[24px] text-[#333] sm:mb-[15px] sm:text-[32px]">
          {memory.title}
        </h2>

        <a
          href={mapsUrl(memory)}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2.5 flex items-center gap-1.5 text-[15px] italic text-[#888] no-underline sm:text-[16px]"
        >
          📍 {memory.location}
        </a>

        <p className="mb-3 text-[14px] text-[#777] sm:mb-[15px]">{memory.date}</p>

        <p className="text-[16px] leading-normal text-[#555]">{memory.description}</p>
      </div>
    </div>
  )
}
