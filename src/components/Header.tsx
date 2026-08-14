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
        <div className="mt-3 text-center text-[13px] italic text-[#999] sm:mt-[15px] sm:text-[14px]">
          Together for {timeElapsed.days} days, {timeElapsed.hours} hours,{' '}
          {timeElapsed.minutes} minutes, and {timeElapsed.seconds} seconds 💕
        </div>
      </div>
    </header>
  )
} 