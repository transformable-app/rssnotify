import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentTestimonials, type ContentTestimonialItem } from '@/components/Content/ContentTestimonials'
import RichText from '@/components/RichText'

type TestimonialsBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    quote?: DefaultTypedEditorState
    author?: string
    role?: string
    company?: string
    image?: string | { url?: string }
  }>
  layout?: 'grid' | 'carousel'
  columns?: string | number
  width?: 'content' | 'full'
  blockType?: 'testimonials'
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = (props) => {
  const { id, items, layout, columns, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const testimonialItems: ContentTestimonialItem[] = items
    .filter((item) => item.author && item.quote)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      quote: item.quote ? <RichText data={item.quote} enableGutter={false} /> : null,
      author: typeof item.author === 'string' ? item.author : '',
      role: typeof item.role === 'string' ? item.role : undefined,
      company: typeof item.company === 'string' ? item.company : undefined,
      image:
        typeof item.image === 'object' && item.image && 'url' in item.image
          ? (item.image.url as string)
          : undefined,
    }))

  if (testimonialItems.length === 0) {
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 1 && columnsNum <= 3 ? columnsNum : 3) as 1 | 2 | 3

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentTestimonials items={testimonialItems} layout={layout} columns={validColumns} />
    </div>
  )
}

