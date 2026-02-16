'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type HeroProps = { links?: unknown[]; logo?: unknown; media?: unknown; richText?: unknown }
export const HighImpactHero: React.FC<HeroProps> = ({ links, logo, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div
      className="relative -mt-[10.4rem] flex items-center text-white"
      data-theme="dark"
    >
      <div className="container mb-8 z-10 relative flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-[36.5rem] text-left flex-shrink-0">
          {richText ? <RichText className="mb-6" data={richText as never} enableGutter={false} /> : null}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex flex-wrap gap-4">
              {(links as Array<{ link?: unknown }>).map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...(typeof link === 'object' && link !== null ? link : {})} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {Boolean(logo && typeof logo === 'object') && (
          <div className="flex-shrink-0 flex items-center justify-end">
            <Media
              resource={logo as never}
              imgClassName="min-h-[900px] min-w-[900px] w-auto h-auto max-w-full object-contain"
              priority
            />
          </div>
        )}
      </div>
      <div className="min-h-[80vh] select-none">
        {Boolean(media && typeof media === 'object') && (
          <Media fill imgClassName="-z-10 object-cover" priority resource={media as never} />
        )}
      </div>
    </div>
  )
}
