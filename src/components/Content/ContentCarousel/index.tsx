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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentCarouselItem = {
  id?: string
  title?: string
  description?: string
  content?: React.ReactNode
  image?: string
}

export type ContentCarouselProps = {
  items: ContentCarouselItem[]
  className?: string
  showNavigation?: boolean
  autoPlay?: boolean
  autoplayDelay?: number
  orientation?: 'horizontal' | 'vertical'
}

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  items,
  className,
  showNavigation = true,
  autoPlay = false,
  autoplayDelay = 4000,
  orientation = 'horizontal',
}) => {
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: autoplayDelay, stopOnInteraction: true }),
    [autoplayDelay]
  )

  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          duration: 30, // Fast scroll animation (20-60ms recommended by Embla) - not affected by autoplay
        }}
        plugins={autoPlay ? [autoplayPlugin] : []}
        orientation={orientation}
        className="w-full"
      >
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={item.id || index}>
              <Card className="h-full">
                {item.image && (
                  <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={item.image}
                      alt={item.title || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  {item.title && <CardTitle>{item.title}</CardTitle>}
                  {item.description && <CardDescription>{item.description}</CardDescription>}
                </CardHeader>
                {item.content && <CardContent>{item.content}</CardContent>}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showNavigation && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </div>
  )
}

