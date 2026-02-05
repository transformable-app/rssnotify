'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentStats, type ContentStatsItem } from '@/components/Content/ContentStats'

export type StatsBlockPreviewProps = {
  items?: Array<{
    id?: string
    label?: string
    value?: number
    description?: string
    icon?: string
  }>
  columns?: string | number
  gap?: 'sm' | 'md' | 'lg'
  width?: 'content' | 'full'
}

export const StatsBlockPreview: React.FC<StatsBlockPreviewProps> = (props) => {
  const { items = [], columns: columnsProp = '3', gap = 'md', width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No statistics configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const statsItems: ContentStatsItem[] = items
    .filter((item) => item.label && typeof item.value === 'number')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      label: typeof item.label === 'string' ? item.label : '',
      value: typeof item.value === 'number' ? item.value : 0,
      description: typeof item.description === 'string' ? item.description : undefined,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
    }))

  if (statsItems.length === 0) {
    return (
      <Banner type="info">
        <p>No valid statistics configured. Please add items with labels and values.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Stats Preview ({statsItems.length} items, {columns} columns) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentStats items={statsItems} columns={columns} gap={gap} />
      </div>
    </div>
  )
}

export default StatsBlockPreview

