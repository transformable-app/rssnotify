import React from 'react'
import { cn } from '@/utilities/ui'

import { ContentGallery, type ContentGalleryItem } from '@/components/Content/ContentGallery'

type GalleryBlockProps = {
  id?: string
  images?: Array<{
    id?: string
    image?: string | { url?: string }
    caption?: string
  }>
  columns?: string | number
  gap?: 'sm' | 'md' | 'lg'
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto'
  lightbox?: boolean
  width?: 'content' | 'full'
  blockType?: 'gallery'
}

export const GalleryBlock: React.FC<GalleryBlockProps> = (props) => {
  const { id, images, columns, gap, aspectRatio, lightbox, width = 'content' } = props

  if (!images || images.length === 0) {
    return null
  }

  const galleryItems: ContentGalleryItem[] = images
    .filter((item) => item.image)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      image:
        typeof item.image === 'object' && item.image && 'url' in item.image
          ? (item.image.url as string)
          : typeof item.image === 'string'
            ? item.image
            : '',
      caption: typeof item.caption === 'string' ? item.caption : undefined,
    }))
    .filter((item) => item.image)

  if (galleryItems.length === 0) {
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentGallery
        items={galleryItems}
        columns={validColumns}
        gap={gap}
        aspectRatio={aspectRatio}
        lightbox={lightbox}
      />
    </div>
  )
}

