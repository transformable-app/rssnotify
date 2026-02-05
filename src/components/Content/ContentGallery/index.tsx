'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/utilities/ui'

export type ContentGalleryItem = {
  id?: string
  image: string
  caption?: string
}

export type ContentGalleryProps = {
  items: ContentGalleryItem[]
  className?: string
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto'
  lightbox?: boolean
}

export const ContentGallery: React.FC<ContentGalleryProps> = ({
  items,
  className,
  columns = 3,
  gap = 'md',
  aspectRatio = 'square',
  lightbox = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const aspectRatios = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: 'aspect-auto',
  }

  const handleImageClick = (index: number) => {
    if (lightbox) {
      setSelectedImageIndex(index)
    }
  }

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null)
  }, [])

  const goToPrevious = useCallback(() => {
    setSelectedImageIndex((currentIndex) => {
      if (currentIndex === null) return null
      if (currentIndex > 0) {
        return currentIndex - 1
      }
      return items.length - 1
    })
  }, [items.length])

  const goToNext = useCallback(() => {
    setSelectedImageIndex((currentIndex) => {
      if (currentIndex === null) return null
      if (currentIndex < items.length - 1) {
        return currentIndex + 1
      }
      return 0
    })
  }, [items.length])

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox || selectedImageIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox, selectedImageIndex, closeLightbox, goToPrevious, goToNext])

  if (!items || items.length === 0) {
    return null
  }

  const currentItem = selectedImageIndex !== null ? items[selectedImageIndex] : null

  return (
    <>
      <div className={cn('w-full', className)}>
        <div className={cn('grid', gridCols[columns], gapClasses[gap])}>
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className={cn(
                'relative overflow-hidden rounded-lg group',
                aspectRatios[aspectRatio],
                lightbox && 'cursor-pointer'
              )}
              onClick={() => lightbox && handleImageClick(index)}
            >
              <Image
                src={item.image}
                alt={item.caption || `Gallery image ${index + 1}`}
                fill
                className={cn(
                  'object-cover transition-transform duration-300',
                  lightbox && 'group-hover:scale-105'
                )}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                  {item.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {lightbox && currentItem && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white text-3xl hover:text-gray-300 transition-colors p-2"
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* Previous button */}
          {items.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-4 bg-black/50 rounded-full hover:bg-black/70"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {items.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-4 bg-black/50 rounded-full hover:bg-black/70"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image container */}
          <div
            className="relative max-w-7xl max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentItem.image}
              alt={currentItem.caption || `Gallery image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-[85vh] object-contain"
              priority
            />
            {currentItem.caption && (
              <div className="mt-4 text-white text-center max-w-2xl px-4">
                <p className="text-lg">{currentItem.caption}</p>
              </div>
            )}
            {items.length > 1 && (
              <div className="mt-2 text-white/70 text-sm">
                {selectedImageIndex + 1} / {items.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

