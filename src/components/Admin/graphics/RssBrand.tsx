'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

const RssGlyph = ({ size }: { size: number }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="5" cy="19" fill="currentColor" r="2" />
    <path d="M4 11C8.41828 11 12 14.5817 12 19" stroke="currentColor" strokeWidth="2.4" />
    <path d="M4 4C12.2843 4 19 10.7157 19 19" stroke="currentColor" strokeWidth="2.4" />
  </svg>
)

export const RssLogo = () => (
  <LogoWithLoginGuard />
)

const LogoWithLoginGuard = () => {
  const pathname = usePathname()

  if (pathname?.endsWith('/login')) return null

  return (
    <span
      aria-label="rssnotify"
      style={{ alignItems: 'center', color: 'var(--theme-text)', display: 'inline-flex' }}
    >
      <RssGlyph size={24} />
    </span>
  )
}

export const RssIcon = () => (
  <span style={{ color: 'var(--theme-text)', display: 'inline-flex' }}>
    <RssGlyph size={20} />
  </span>
)
