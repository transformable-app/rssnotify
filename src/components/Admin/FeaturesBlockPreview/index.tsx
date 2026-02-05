'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentFeatures, type ContentFeatureItem } from '@/components/Content/ContentFeatures'

export type FeaturesBlockPreviewProps = {
  items?: Array<{
    id?: string
    title?: string
    description?: unknown
    icon?: string
  }>
  layout?: 'grid' | 'list'
  columns?: string | number
  width?: 'content' | 'full'
}

export const FeaturesBlockPreview: React.FC<FeaturesBlockPreviewProps> = (props) => {
  const { items = [], layout = 'grid', columns: columnsProp = '3', width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No features configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const featureItems: ContentFeatureItem[] = items
    .filter((item) => item.title && item.description)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : '',
      description: item.description ? (
        <div>{typeof item.description === 'string' ? item.description : 'Rich text content'}</div>
      ) : null,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
    }))

  if (featureItems.length === 0) {
    return (
      <Banner type="info">
        <p>No valid features configured. Please add items with titles and descriptions.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Features Preview ({featureItems.length} items, {layout}, {columns} columns) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentFeatures items={featureItems} layout={layout} columns={columns} />
      </div>
    </div>
  )
}

export default FeaturesBlockPreview

