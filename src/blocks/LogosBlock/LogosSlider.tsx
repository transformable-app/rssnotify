'use client'

import React from 'react'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/utilities/ui'

export type LogosSliderItem = {
  id: string
  url: string
  alt?: string | null
  linkUrl?: string | null
  openInNewTab?: boolean | null
}

const SLIDE_GRID_COLS: Record<number, string> = {
  1: 'grid-cols-2',
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  7: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7',
  8: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8',
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

type LogosSliderProps = {
  items: LogosSliderItem[]
  columns: number
  intervalMs: number
  showArrows: boolean
  className?: string
}

export const LogosSlider: React.FC<LogosSliderProps> = ({
  items,
  columns,
  intervalMs,
  showArrows = true,
  className,
}) => {
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: intervalMs, stopOnInteraction: true }),
    [intervalMs],
  )

  if (!items || items.length === 0) {
    return null
  }

  const cols = Math.min(Math.max(1, columns), 8)
  const pages = chunk(items, cols)
  const gridClass = SLIDE_GRID_COLS[cols] ?? SLIDE_GRID_COLS[5]

  return (
    <div className={cn('relative w-full', className)}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          duration: 30,
        }}
        plugins={[autoplayPlugin]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {pages.map((page, pageIndex) => (
            <CarouselItem key={pageIndex} className="pl-4 basis-full">
              <div
                className={cn(
                  'grid gap-4 md:gap-6',
                  gridClass,
                )}
              >
                {page.map((item) => {
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
            </CarouselItem>
          ))}
        </CarouselContent>
        {showArrows && (
          <>
            <CarouselPrevious className="-left-2 md:-left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="-right-2 md:-right-4 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>
    </div>
  )
}
