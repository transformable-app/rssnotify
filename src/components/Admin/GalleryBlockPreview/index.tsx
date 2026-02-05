'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentGallery, type ContentGalleryItem } from '@/components/Content/ContentGallery'

export type GalleryBlockPreviewProps = {
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
}

export const GalleryBlockPreview: React.FC<GalleryBlockPreviewProps> = (props) => {
  const {
    images = [],
    columns: columnsProp = '3',
    gap = 'md',
    aspectRatio = 'square',
    lightbox = false,
    width = 'content',
  } = props

  if (!images || images.length === 0) {
    return (
      <Banner type="info">
        <p>No images configured. Add images to see the preview.</p>
      </Banner>
    )
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
    return (
      <Banner type="info">
        <p>No valid images configured. Please add images to the gallery.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Gallery Preview ({galleryItems.length} images, {columns} columns, {aspectRatio}) -
          Width: {width === 'content' ? 'Content' : 'Full'}
          {lightbox && ' - Lightbox enabled'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentGallery
          items={galleryItems}
          columns={columns}
          gap={gap}
          aspectRatio={aspectRatio}
          lightbox={lightbox}
        />
      </div>
    </div>
  )
}

export default GalleryBlockPreview

