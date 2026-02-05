'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentCarousel, type ContentCarouselItem } from '@/components/Content/ContentCarousel'

export type CarouselBlockPreviewProps = {
  items?: Array<{
    id?: string
    title?: string
    description?: string
    content?: string
    image?: string | { url?: string }
  }>
  showNavigation?: boolean
  autoPlay?: boolean
  autoplayDelay?: number
  width?: 'content' | 'full'
}

export const CarouselBlockPreview: React.FC<CarouselBlockPreviewProps> = (props) => {
  const { items = [], showNavigation = true, autoPlay = false, autoplayDelay, width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No carousel items configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const carouselItems: ContentCarouselItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    content: typeof item.content === 'string' ? item.content : undefined,
    image:
      typeof item.image === 'string'
        ? item.image
        : typeof item.image === 'object' && item.image && 'url' in item.image
          ? (item.image.url as string)
          : undefined,
  }))

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Carousel Preview ({items.length} items) - Width: {width === 'content' ? 'Content' : 'Full'}
          {autoPlay && autoplayDelay && ` - Autoplay: ${autoplayDelay}ms`}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto overflow-hidden' : 'w-full overflow-hidden'}>
        <ContentCarousel
          items={carouselItems}
          showNavigation={showNavigation}
          autoPlay={autoPlay}
          autoplayDelay={autoplayDelay}
        />
      </div>
    </div>
  )
}

export default CarouselBlockPreview

