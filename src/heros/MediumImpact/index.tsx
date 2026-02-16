import React from 'react'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type HeroProps = { links?: unknown[]; media?: unknown; richText?: unknown }
export const MediumImpactHero: React.FC<HeroProps> = ({ links, media, richText }) => {
  return (
    <div className="">
      <div className="container mb-8">
        {richText ? <RichText className="mb-6" data={richText as never} enableGutter={false} /> : null}

        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex gap-4">
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
      <div className="container ">
        {Boolean(media && typeof media === 'object') && (
          <div>
            <Media
              className="-mx-4 md:-mx-8 2xl:-mx-16"
              imgClassName=""
              priority
              resource={media as never}
            />
            {(media as { caption?: unknown })?.caption ? (
              <div className="mt-3">
                <RichText data={(media as { caption: unknown }).caption as never} enableGutter={false} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
