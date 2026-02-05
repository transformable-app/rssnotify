'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentAccordion, type ContentAccordionItem } from '@/components/Content/ContentAccordion'

export type AccordionBlockPreviewProps = {
  items?: Array<{
    id?: string
    title?: string
    description?: string
    content?: unknown
  }>
  type?: 'single' | 'multiple'
  collapsible?: boolean
  width?: 'content' | 'full'
}

export const AccordionBlockPreview: React.FC<AccordionBlockPreviewProps> = (props) => {
  const { items = [], type = 'single', collapsible = true, width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No accordion items configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const accordionItems: ContentAccordionItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : 'Untitled',
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? (
      <div className="py-2">
        {typeof item.content === 'string' ? item.content : 'Rich text content'}
      </div>
    ) : null,
  }))

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>Accordion Preview ({items.length} items) - Width: {width === 'content' ? 'Content' : 'Full'}</p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentAccordion items={accordionItems} type={type} collapsible={collapsible} />
      </div>
    </div>
  )
}

export default AccordionBlockPreview

