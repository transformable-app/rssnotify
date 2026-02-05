'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentColumns, type ContentColumnItem } from '@/components/Content/ContentColumns'

export type ColumnsBlockPreviewProps = {
  items?: Array<{
    id?: string
    title?: string
    description?: string
    content?: unknown
    image?: string | { url?: string }
  }>
  columns?: string | number
  gap?: 'sm' | 'md' | 'lg'
  width?: 'content' | 'full'
}

export const ColumnsBlockPreview: React.FC<ColumnsBlockPreviewProps> = (props) => {
  const { items = [], columns: columnsProp = '3', gap = 'md', width = 'content' } = props
  
  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp
  const columns = (columnsNum >= 1 && columnsNum <= 4 ? columnsNum : 3) as 1 | 2 | 3 | 4

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No column items configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const columnItems: ContentColumnItem[] = items.map((item) => ({
    id: typeof item.id === 'string' ? item.id : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    content: item.content ? String(item.content) : undefined,
    image:
      typeof item.image === 'string'
        ? item.image
        : typeof item.image === 'object' && item.image && 'url' in item.image
          ? (item.image.url as string)
          : undefined,
  }))

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>Columns Preview ({items.length} items, {columns} columns) - Width: {width === 'content' ? 'Content' : 'Full'}</p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentColumns items={columnItems} columns={columns} gap={gap} />
      </div>
    </div>
  )
}

export default ColumnsBlockPreview

