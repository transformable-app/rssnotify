'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentTestimonials, type ContentTestimonialItem } from '@/components/Content/ContentTestimonials'

export type TestimonialsBlockPreviewProps = {
  items?: Array<{
    id?: string
    quote?: unknown
    author?: string
    role?: string
    company?: string
    image?: string | { url?: string }
  }>
  layout?: 'grid' | 'carousel'
  columns?: string | number
  width?: 'content' | 'full'
}

export const TestimonialsBlockPreview: React.FC<TestimonialsBlockPreviewProps> = (props) => {
  const { items = [], layout = 'grid', columns: columnsProp = '3', width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No testimonials configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const testimonialItems: ContentTestimonialItem[] = items
    .filter((item) => item.author && item.quote)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      quote: item.quote ? (
        <div>{typeof item.quote === 'string' ? item.quote : 'Rich text content'}</div>
      ) : null,
      author: typeof item.author === 'string' ? item.author : '',
      role: typeof item.role === 'string' ? item.role : undefined,
      company: typeof item.company === 'string' ? item.company : undefined,
      image:
        typeof item.image === 'object' && item.image && 'url' in item.image
          ? (item.image.url as string)
          : undefined,
    }))

  if (testimonialItems.length === 0) {
    return (
      <Banner type="info">
        <p>No valid testimonials configured. Please add items with quotes and authors.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 1 && columnsNum <= 3 ? columnsNum : 3) as 1 | 2 | 3

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Testimonials Preview ({testimonialItems.length} items, {layout}, {columns} columns) -
          Width: {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentTestimonials items={testimonialItems} layout={layout} columns={columns} />
      </div>
    </div>
  )
}

export default TestimonialsBlockPreview

