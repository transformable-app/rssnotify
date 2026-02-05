'use client'

import React, { useEffect, useRef, useState } from 'react'

type CountUpNumberProps = {
  value: number
  suffix?: string | null
  subtitle: string
  duration?: number
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  suffix,
  subtitle,
  duration = 2000,
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' },
    )

    const el = ref.current
    if (el) observer.observe(el)
    return () => (el ? observer.unobserve(el) : undefined)
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    const start = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for a smooth finish
      const eased = 1 - (1 - progress) ** 3
      const current = Math.round(start + (value - start) * eased)
      setDisplayValue(current)
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [hasAnimated, value, duration])

  const suffixStr = suffix ?? ''

  return (
    <div ref={ref} className="text-left">
      <div
        className="mb-3 h-px w-12 bg-white"
        aria-hidden
      />
      <div
        className="text-white font-bold tabular-nums tracking-wider"
        style={{
          fontFamily: 'var(--font-anton)',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1,
        }}
      >
        {displayValue}
        {suffixStr}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white font-inter">
          {subtitle}
        </p>
      )}
    </div>
  )
}
