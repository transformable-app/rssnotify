'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentTabs, type ContentTabItem } from '@/components/Content/ContentTabs'

export type TabsBlockPreviewProps = {
  items?: Array<{
    id?: string
    label?: string
    description?: string
    content?: unknown
  }>
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  width?: 'content' | 'full'
}

export const TabsBlockPreview: React.FC<TabsBlockPreviewProps> = (props) => {
  const { items = [], defaultValue, orientation = 'horizontal', width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No tabs configured. Add tabs to see the preview.</p>
      </Banner>
    )
  }

  const tabItems: ContentTabItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    label: typeof item.label === 'string' ? item.label : 'Untitled Tab',
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? (
      <div>
        {typeof item.content === 'string' ? item.content : 'Rich text content'}
      </div>
    ) : null,
  }))

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>Tabs Preview ({items.length} tabs) - Width: {width === 'content' ? 'Content' : 'Full'}</p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentTabs items={tabItems} defaultValue={defaultValue} orientation={orientation} />
      </div>
    </div>
  )
}

export default TabsBlockPreview

