'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="w-full text-white relative z-20"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="w-full bg-[#fe8735]">
        <div className="container py-8 flex flex-col md:flex-row md:justify-between items-center gap-4 text-white [&_.text-foreground]:text-white">
          <Link href="/" className="flex justify-center md:justify-start">
            {data?.logo && typeof data.logo === 'object' ? (
              <Media
                resource={data.logo}
                imgClassName="max-w-[9.375rem] w-full h-[34px]"
                priority
                loading="eager"
              />
            ) : (
              <Logo loading="eager" priority="high" />
            )}
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <HeaderNav data={data} />
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href="/search" title="Search">
                <span className="sr-only">Search</span>
                <SearchIcon className="w-5 h-5 text-white" />
              </Link>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-2.5 bg-[#fe8735]/80" aria-hidden />
    </header>
  )
}
