import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentTabs, type ContentTabItem } from '@/components/Content/ContentTabs'
import RichText from '@/components/RichText'

type TabsBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    label?: string
    description?: string
    content?: DefaultTypedEditorState
  }>
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  width?: 'content' | 'full'
  blockType?: 'tabs'
}

export const TabsBlock: React.FC<TabsBlockProps> = (props) => {
  const { id, items, defaultValue, orientation, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const tabItems: ContentTabItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    label: typeof item.label === 'string' ? item.label : '',
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? <RichText data={item.content} enableGutter={false} /> : null,
  }))

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentTabs items={tabItems} defaultValue={defaultValue} orientation={orientation} />
    </div>
  )
}

