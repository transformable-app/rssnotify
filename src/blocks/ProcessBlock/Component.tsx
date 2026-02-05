import NextImage from 'next/image'
import React from 'react'

import type { Media, Page, Post, ProcessBlock as ProcessBlockType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

const ACCENT_COLORS: Record<string, string> = {
  orange: 'bg-[#E85D04]',
  teal: 'bg-[#0D9488]',
  green: 'bg-[#4D7C0F]',
}

export const ProcessBlock: React.FC<ProcessBlockType> = (props) => {
  const { id, subtitle, title, steps } = props

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <section className="my-16 container" id={id ? `block-${id}` : undefined}>
      <header className="mb-10">
        {subtitle && (
          <p className="font-inter text-base font-semibold text-[#F9600B] mb-2 uppercase">
            {subtitle}
          </p>
        )}
        {title && (() => {
          const words = title.split(/\s+/).filter(Boolean)
          const firstThree = words.slice(0, 3).join(' ')
          const rest = words.slice(3).join(' ')
          return (
            <h2
              className="uppercase leading-none"
              style={{
                fontFamily: 'var(--font-anton)',
                fontWeight: 400,
                fontSize: 'clamp(3rem, 8vw, 100px)',
              }}
            >
              <span className="text-foreground">{firstThree}</span>
              {rest ? (
                <>
                  <br />
                  <span className="text-[#F9600B]">{rest}</span>
                </>
              ) : null}
            </h2>
          )
        })()}
      </header>

      <div className="flex flex-col gap-6">
        {steps.map((step, index) => {
          const bgMedia =
            step.backgroundImage && typeof step.backgroundImage === 'object'
              ? (step.backgroundImage as Media)
              : null
          const bgUrl =
            bgMedia && 'url' in bgMedia && typeof bgMedia.url === 'string'
              ? getMediaUrl(bgMedia.url, bgMedia.updatedAt)
              : null
          const accent = step.accentColor ?? 'orange'
          const bgClass = ACCENT_COLORS[accent] ?? ACCENT_COLORS.orange

          const normalizedLink =
            step.link && (step.link.url || step.link.reference)
              ? {
                  type: (step.link.type || 'custom') as 'reference' | 'custom',
                  url: step.link.url ?? undefined,
                  label: step.link.label ?? 'Read more',
                  newTab: step.link.newTab ?? undefined,
                  reference:
                    step.link.reference &&
                    typeof step.link.reference.value === 'object' &&
                    step.link.reference.value !== null
                      ? {
                          relationTo: (step.link.reference.relationTo ||
                            'pages') as 'pages' | 'posts',
                          value: step.link.reference.value as Page | Post,
                        }
                      : undefined,
                }
              : null

          const content = (
            <div className="relative z-10 flex flex-1 flex-row items-center justify-start gap-4 sm:gap-6 py-6 pl-3 pr-6 md:py-8 md:pl-4 md:pr-8 text-left">
              <span
                className="text-5xl md:text-6xl font-medium text-white opacity-40 transition-opacity tabular-nums shrink-0 ml-6 mr-4 group-hover:opacity-80"
                style={{ fontFamily: 'var(--font-anton)' }}
                aria-hidden
              >
                {String(step.number).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide mb-2">
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-white/95 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )

          const wrapperClass = cn(
            'group relative flex flex-col rounded-2xl overflow-hidden min-h-[180px]',
            !bgUrl && bgClass,
          )

          if (normalizedLink && (normalizedLink.url || normalizedLink.reference?.value)) {
            return (
              <CMSLink
                key={index}
                {...normalizedLink}
                label={undefined}
                appearance="inline"
                className={cn('block', wrapperClass)}
              >
                {bgUrl && (
                  <div className="absolute inset-0 z-0">
                    <NextImage
                      src={bgUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                  </div>
                )}
                {content}
              </CMSLink>
            )
          }

          return (
            <div key={index} className={wrapperClass}>
              {bgUrl && (
                <div className="absolute inset-0 z-0">
                  <NextImage
                    src={bgUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                </div>
              )}
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
