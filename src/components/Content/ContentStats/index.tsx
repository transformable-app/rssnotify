import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentStatsItem = {
  id?: string
  label: string
  value: number
  description?: string
  icon?: string
}

export type ContentStatsProps = {
  items: ContentStatsItem[]
  className?: string
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export const ContentStats: React.FC<ContentStatsProps> = ({
  items,
  className,
  columns = 3,
  gap = 'md',
}) => {
  if (!items || items.length === 0) {
    return null
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', gridCols[columns], gapClasses[gap])}>
        {items.map((item, index) => (
          <Card key={item.id || index} className="text-center">
            <CardContent className="pt-6">
              {item.icon && (
                <div className="text-4xl mb-4">{item.icon}</div>
              )}
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {item.value.toLocaleString()}
              </div>
              <div className="text-lg font-semibold mb-1">{item.label}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground">{item.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

