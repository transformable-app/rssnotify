'use client'

import React from 'react'

import type { LegacyHeader } from '@/types/legacy'

import { CMSLink } from '@/components/Link'

export const HeaderNav: React.FC<{ data: LegacyHeader }> = ({ data }) => {
  const navItems = data?.navItems || []

  // Debug: log to see what we're getting
  if (typeof window !== 'undefined' && navItems.length > 0) {
    console.log('HeaderNav navItems:', navItems)
  }

  return (
    <nav className="flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto">
      {navItems.map(({ link }, i) => {
        if (!link) return null
        
        // Debug individual link
        if (typeof window !== 'undefined') {
          console.log(`Link ${i}:`, { type: link.type, label: link.label, url: link.url, reference: link.reference })
        }
        
        const linkComponent = (
          <CMSLink
            key={i}
            {...(link as React.ComponentProps<typeof CMSLink>)}
            appearance="link"
            className="uppercase text-[#fff5d0] text-lg font-semibold tracking-wide hover:text-[#fff5d0]"
          />
        )
        
        // If CMSLink returns null, show a fallback
        if (!linkComponent) {
          console.warn(`CMSLink returned null for link ${i}:`, link)
          return null
        }
        
        return linkComponent
      })}
    </nav>
  )
}
