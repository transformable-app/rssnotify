import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentFeatures, type ContentFeatureItem } from '@/components/Content/ContentFeatures'
import RichText from '@/components/RichText'

type FeaturesBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    title?: string
    description?: DefaultTypedEditorState
    icon?: string
  }>
  layout?: 'grid' | 'list'
  columns?: string | number
  width?: 'content' | 'full'
  blockType?: 'features'
}

export const FeaturesBlock: React.FC<FeaturesBlockProps> = (props) => {
  const { id, items, layout, columns, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const featureItems: ContentFeatureItem[] = items
    .filter((item) => item.title && item.description)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : '',
      description: item.description ? <RichText data={item.description} enableGutter={false} /> : null,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
    }))

  if (featureItems.length === 0) {
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentFeatures items={featureItems} layout={layout} columns={validColumns} />
    </div>
  )
}

