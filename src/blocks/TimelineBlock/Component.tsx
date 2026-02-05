import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentTimeline, type ContentTimelineItem } from '@/components/Content/ContentTimeline'
import RichText from '@/components/RichText'

type TimelineBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    date?: string
    title?: string
    description?: DefaultTypedEditorState
    icon?: string
  }>
  orientation?: 'vertical' | 'horizontal'
  width?: 'content' | 'full'
  blockType?: 'timeline'
}

export const TimelineBlock: React.FC<TimelineBlockProps> = (props) => {
  const { id, items, orientation, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const timelineItems: ContentTimelineItem[] = items
    .filter((item) => item.date && item.title)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      date: typeof item.date === 'string' ? item.date : '',
      title: typeof item.title === 'string' ? item.title : '',
      description: item.description ? <RichText data={item.description} enableGutter={false} /> : undefined,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
    }))

  if (timelineItems.length === 0) {
    return null
  }

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentTimeline items={timelineItems} orientation={orientation} />
    </div>
  )
}

