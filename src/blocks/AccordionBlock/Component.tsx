import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentAccordion, type ContentAccordionItem } from '@/components/Content/ContentAccordion'
import RichText from '@/components/RichText'

type AccordionBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    title?: string
    description?: string
    content?: DefaultTypedEditorState
  }>
  type?: 'single' | 'multiple'
  collapsible?: boolean
  width?: 'content' | 'full'
  blockType?: 'accordion'
}

export const AccordionBlock: React.FC<AccordionBlockProps> = (props) => {
  const { id, items, type, collapsible, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const accordionItems: ContentAccordionItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : '',
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? <RichText data={item.content} enableGutter={false} /> : null,
  }))

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentAccordion items={accordionItems} type={type} collapsible={collapsible} />
    </div>
  )
}

