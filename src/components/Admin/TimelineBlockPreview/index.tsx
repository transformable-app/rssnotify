'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentTimeline, type ContentTimelineItem } from '@/components/Content/ContentTimeline'

export type TimelineBlockPreviewProps = {
  items?: Array<{
    id?: string
    date?: string
    title?: string
    description?: unknown
    icon?: string
  }>
  orientation?: 'vertical' | 'horizontal'
  width?: 'content' | 'full'
}

export const TimelineBlockPreview: React.FC<TimelineBlockPreviewProps> = (props) => {
  const { items = [], orientation = 'vertical', width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No timeline items configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const timelineItems: ContentTimelineItem[] = items
    .filter((item) => item.date && item.title)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      date: typeof item.date === 'string' ? item.date : '',
      title: typeof item.title === 'string' ? item.title : '',
      description: item.description ? (
        <div>{typeof item.description === 'string' ? item.description : 'Rich text content'}</div>
      ) : undefined,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
    }))

  if (timelineItems.length === 0) {
    return (
      <Banner type="info">
        <p>No valid timeline items configured. Please add items with dates and titles.</p>
      </Banner>
    )
  }

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Timeline Preview ({timelineItems.length} items, {orientation}) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentTimeline items={timelineItems} orientation={orientation} />
      </div>
    </div>
  )
}

export default TimelineBlockPreview

