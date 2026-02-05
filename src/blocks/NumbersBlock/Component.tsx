import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Media } from '@/components/Media'

import { CountUpNumber } from './CountUpNumber'

type NumbersBlockProps = {
  id?: string
  subtitle?: string | null
  title?: string | null
  backgroundImage?:
    | {
        url?: string | null
        updatedAt?: string | null
        [key: string]: unknown
      }
    | string
    | null
  numbers?: Array<{
    id?: string | null
    value?: number
    suffix?: string | null
    subtitle?: string | null
  }> | null
  blockType?: 'numbers'
}

export const NumbersBlock: React.FC<NumbersBlockProps> = async (props) => {
  const { id, subtitle, title, backgroundImage: backgroundImageProp, numbers } = props

  let bgResource: NumbersBlockProps['backgroundImage'] = backgroundImageProp
  if (typeof bgResource === 'string' && bgResource) {
    const payload = await getPayload({ config: configPromise })
    const media = await payload.findByID({
      collection: 'media',
      id: bgResource,
      depth: 0,
    })
    bgResource = media ? (media as unknown as NumbersBlockProps['backgroundImage']) : null
  }

  const numbersList = Array.isArray(numbers) && numbers.length > 0 ? numbers : []
  const hasBgImage =
    bgResource && typeof bgResource === 'object' && !Array.isArray(bgResource)

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      id={id ? `block-${id}` : undefined}
    >
      {hasBgImage && (
        <div className="absolute inset-0 z-0">
          <Media
            fill
            imgClassName="object-cover"
            priority={false}
            resource={bgResource as never}
          />
        </div>
      )}

      <div className="container relative z-10">
        <header className="mb-12 md:mb-16">
          {subtitle && (
            <p className="font-inter text-base font-semibold text-white mb-2 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
          {title && (() => {
            const words = title.split(/\s+/).filter(Boolean)
            const firstTwo = words.slice(0, 2).join(' ')
            const rest = words.slice(2).join(' ')
            return (
              <h2
                className="uppercase leading-none"
                style={{
                  fontFamily: 'var(--font-anton)',
                  fontWeight: 400,
                  fontSize: 'clamp(2.5rem, 6vw, 80px)',
                }}
              >
                <span className="text-black">{firstTwo}</span>
                {rest ? (
                  <>
                    <br />
                    <span className="text-[#FFF5D0]">{rest}</span>
                  </>
                ) : null}
              </h2>
            )
          })()}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {numbersList.map((item, index) => {
            const value =
              typeof item.value === 'number' ? item.value : Number(item.value) || 0
            const itemSubtitle =
              typeof item.subtitle === 'string' ? item.subtitle : ''
            const itemSuffix =
              typeof item.suffix === 'string' && item.suffix !== ''
                ? item.suffix
                : null

            return (
              <CountUpNumber
                key={item.id ?? index}
                value={value}
                suffix={itemSuffix}
                subtitle={itemSubtitle}
                duration={2000}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
