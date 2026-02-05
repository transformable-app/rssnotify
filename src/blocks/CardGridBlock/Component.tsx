import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentCardGrid, type ContentCardGridItem } from '@/components/Content/ContentCardGrid'
import RichText from '@/components/RichText'

type CardGridBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    title?: string
    description?: string
    content?: DefaultTypedEditorState
    image?: string | { url?: string }
    footer?: string
  }>
  columns?: string | number
  gap?: 'sm' | 'md' | 'lg'
  width?: 'content' | 'full'
  blockType?: 'cardGrid'
}

export const CardGridBlock: React.FC<CardGridBlockProps> = (props) => {
  const { id, items, columns, gap, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const cardItems: ContentCardGridItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? <RichText data={item.content} enableGutter={false} /> : undefined,
    image:
      typeof item.image === 'object' && item.image && 'url' in item.image
        ? (item.image.url as string)
        : undefined,
    footer: typeof item.footer === 'string' ? item.footer : undefined,
  }))

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 1 && columnsNum <= 4 ? columnsNum : 3) as 1 | 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentCardGrid items={cardItems} columns={validColumns} gap={gap} />
    </div>
  )
}

