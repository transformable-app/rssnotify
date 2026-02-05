import React from 'react'
import Image from 'next/image'

import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

import { LogosSlider } from './LogosSlider'

const XL_GRID_COLS: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
  7: 'xl:grid-cols-7',
  8: 'xl:grid-cols-8',
}

type LogoItem = {
  id?: string | null
  logo?: string | { id?: string; url?: string; alt?: string | null; updatedAt?: string | null } | null
  linkUrl?: string | null
  openInNewTab?: boolean | null
}

type LogosBlockProps = {
  id?: string
  subtitle?: string | null
  title?: string | null
  logos?: Array<LogoItem> | null
  logosAtLargestResolution?: number | null
  useSlider?: boolean | null
  sliderInterval?: number | null
  showArrows?: boolean | null
  blockType?: 'logos'
}

type NormalizedLogo = {
  id: string
  url: string
  alt?: string | null
  linkUrl?: string | null
  openInNewTab?: boolean | null
}

function normalizeLogos(logos: Array<LogoItem> | null | undefined): NormalizedLogo[] {
  if (!Array.isArray(logos) || logos.length === 0) return []
  const result: NormalizedLogo[] = []
  for (const entry of logos) {
    const media = entry.logo && typeof entry.logo === 'object' ? entry.logo : null
    const url = media && typeof media.url === 'string' ? getMediaUrl(media.url, media.updatedAt) : ''
    if (!url) continue
    const linkUrl =
      typeof entry.linkUrl === 'string' && entry.linkUrl.trim() !== '' ? entry.linkUrl.trim() : undefined
    result.push({
      id: String(typeof entry.id === 'string' ? entry.id : media?.id ?? Math.random()),
      url,
      alt: media && typeof media.alt === 'string' ? media.alt : undefined,
      linkUrl: linkUrl ?? undefined,
      openInNewTab: entry.openInNewTab ?? true,
    })
  }
  return result
}

export const LogosBlock: React.FC<LogosBlockProps> = (props) => {
  const {
    id,
    subtitle,
    title,
    logos,
    logosAtLargestResolution = 5,
    useSlider = false,
    sliderInterval = 4000,
    showArrows = true,
  } = props

  const items = normalizeLogos(logos)
  if (items.length === 0) return null

  const cols = Math.min(Math.max(1, Number(logosAtLargestResolution) || 5), 8)
  const xlColsClass = XL_GRID_COLS[cols] ?? XL_GRID_COLS[5]

  return (
    <section className="my-16 container" id={id ? `block-${id}` : undefined}>
      {(subtitle || title) && (
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
      )}
      {useSlider ? (
        <LogosSlider
          items={items}
          columns={cols}
          intervalMs={sliderInterval ?? 4000}
          showArrows={showArrows ?? true}
        />
      ) : (
        <div
          className={cn(
            'grid grid-cols-2 md:grid-cols-3 gap-6',
            xlColsClass,
          )}
        >
          {items.map((item) => {
            const cell = (
              <div className="flex items-center justify-center p-4 md:p-6 min-h-[100px] bg-white dark:bg-muted/30 rounded-lg">
                <div className="relative w-full max-w-[180px] aspect-[2/1]">
                  <Image
                    src={item.url}
                    alt={item.alt ?? ''}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                </div>
              </div>
            )
            return (
              <div key={item.id}>
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="block"
                  >
                    {cell}
                  </a>
                ) : (
                  cell
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
