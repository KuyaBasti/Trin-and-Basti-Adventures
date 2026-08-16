'use client'

import React, { useState, useEffect } from 'react'

interface TimeElapsed {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Header() {
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  // False until the first real tick, so the server-rendered zeros are never
  // shown — the timer fades in already correct.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const startDate = new Date('2024-07-03T00:00:00')

    const updateTimer = () => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeElapsed({ days, hours, minutes, seconds })
    }

    updateTimer()
    setReady(true)
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])
  return (
    <header className="relative bg-white py-4 text-center shadow-[0_2px_5px_rgba(0,0,0,0.1)] sm:py-5">
      <div className="mx-auto box-content max-w-[1200px] px-[15px]">
        <h1
          className="m-0 text-center text-[30px] text-[#333] sm:text-[40px] lg:text-[48px]"
          style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
          }}
        >
          Trin and Basti Adventures
        </h1>
        <p className="my-2.5 text-center text-[15px] italic text-[#777] sm:text-[18px]">
          I am so lucky to have you in my life. The moments we&apos;ve shared have been
          nothing short of magical. I am so grateful to have you in my life. I love you
          more than words can say.
        </p>
        <div
          // One-time entrance only — the per-second tick itself never animates.
          // Opacity-led, so it stays gentle under prefers-reduced-motion too.
          className={`mt-4 transition-[opacity,transform] duration-500 ease-out sm:mt-5 ${
            ready ? 'translate-y-0 opacity-100' : 'translate-y-[4px] opacity-0'
          } motion-reduce:translate-y-0 motion-reduce:transition-opacity`}
          aria-label={`Together for ${timeElapsed.days} days, ${timeElapsed.hours} hours, ${timeElapsed.minutes} minutes, and ${timeElapsed.seconds} seconds`}
        >
          <div className="text-center text-[10px] uppercase tracking-[0.25em] text-[#999] sm:text-[11px]">
            Together for
          </div>
          <div
            className="mt-1.5 flex items-baseline justify-center gap-4 sm:gap-7"
            aria-hidden="true"
          >
            {(
              [
                ['days', timeElapsed.days],
                ['hours', timeElapsed.hours],
                ['minutes', timeElapsed.minutes],
                ['seconds', timeElapsed.seconds],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="text-center">
                <div
                  // Tabular figures + a reserved width: the ticking numbers
                  // must never make their neighbours shift.
                  className="min-w-[2ch] text-[26px] leading-none text-[#333] [font-variant-numeric:tabular-nums] sm:text-[34px]"
                  style={{
                    fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
                  }}
                >
                  {value}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#aaa] sm:text-[10px]">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-[12px] italic text-[#999] sm:text-[13px]">
            and counting 💕
          </div>
        </div>
      </div>
    </header>
  )
} 