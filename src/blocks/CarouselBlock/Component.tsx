import React from 'react'
import { cn } from '@/utilities/ui'

import { ContentCarousel, type ContentCarouselItem } from '@/components/Content/ContentCarousel'

type CarouselBlockProps = {
  id?: string
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
  blockType?: 'carousel'
}

export const CarouselBlock: React.FC<CarouselBlockProps> = (props) => {
  const { id, items, showNavigation, autoPlay, autoplayDelay, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const carouselItems: ContentCarouselItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    content: typeof item.content === 'string' ? item.content : undefined,
    image:
      typeof item.image === 'object' && item.image && 'url' in item.image
        ? (item.image.url as string)
        : undefined,
  }))

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentCarousel
        items={carouselItems}
        showNavigation={showNavigation}
        autoPlay={autoPlay}
        autoplayDelay={autoplayDelay}
      />
    </div>
  )
}

