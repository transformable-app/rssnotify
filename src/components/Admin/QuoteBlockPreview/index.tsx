'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentQuote } from '@/components/Content/ContentQuote'

export type QuoteBlockPreviewProps = {
  quote?: unknown
  author?: string
  role?: string
  company?: string
  image?: string | { url?: string }
  style?: 'default' | 'large' | 'minimal'
  width?: 'content' | 'full'
}

export const QuoteBlockPreview: React.FC<QuoteBlockPreviewProps> = (props) => {
  const { quote, author, role, company, image, style = 'default', width = 'content' } = props

  if (!quote) {
    return (
      <Banner type="info">
        <p>No quote configured. Add a quote to see the preview.</p>
      </Banner>
    )
  }

  const imageUrl =
    typeof image === 'object' && image && 'url' in image ? (image.url as string) : undefined

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Quote Preview ({style} style) - Width: {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentQuote
          quote={typeof quote === 'string' ? quote : <div>Rich text content</div>}
          author={author}
          role={role}
          company={company}
          image={imageUrl}
          style={style}
        />
      </div>
    </div>
  )
}

export default QuoteBlockPreview

