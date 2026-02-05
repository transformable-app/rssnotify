import React from 'react'
import { cn } from '@/utilities/ui'

import { ContentStats, type ContentStatsItem } from '@/components/Content/ContentStats'

type StatsBlockProps = {
  id?: string
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
  blockType?: 'stats'
}

export const StatsBlock: React.FC<StatsBlockProps> = (props) => {
  const { id, items, columns, gap, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
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
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentStats items={statsItems} columns={validColumns} gap={gap} />
    </div>
  )
}

