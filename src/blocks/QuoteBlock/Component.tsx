import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentQuote } from '@/components/Content/ContentQuote'
import RichText from '@/components/RichText'

type QuoteBlockProps = {
  id?: string
  quote?: DefaultTypedEditorState
  author?: string
  role?: string
  company?: string
  image?: string | { url?: string }
  style?: 'default' | 'large' | 'minimal'
  width?: 'content' | 'full'
  blockType?: 'quote'
}

export const QuoteBlock: React.FC<QuoteBlockProps> = (props) => {
  const { id, quote, author, role, company, image, style, width = 'content' } = props

  if (!quote) {
    return null
  }

  const imageUrl =
    typeof image === 'object' && image && 'url' in image ? (image.url as string) : undefined

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentQuote
        quote={<RichText data={quote} enableGutter={false} />}
        author={author}
        role={role}
        company={company}
        image={imageUrl}
        style={style}
      />
    </div>
  )
}

