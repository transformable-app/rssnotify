import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentTimelineItem = {
  id?: string
  date: string
  title: string
  description?: React.ReactNode
  icon?: string
}

export type ContentTimelineProps = {
  items: ContentTimelineItem[]
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

export const ContentTimeline: React.FC<ContentTimelineProps> = ({
  items,
  className,
  orientation = 'vertical',
}) => {
  if (!items || items.length === 0) {
    return null
  }

  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex overflow-x-auto pb-4 gap-4">
          {items.map((item, index) => (
            <Card key={item.id || index} className="min-w-[300px] flex-shrink-0">
              <CardHeader>
                <div className="flex items-start gap-3">
                  {item.icon && <div className="text-2xl flex-shrink-0">{item.icon}</div>}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{item.date}</div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {item.description && <CardContent>{item.description}</CardContent>}
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
        <div className="space-y-8">
          {items.map((item, index) => (
            <div key={item.id || index} className="relative flex gap-6">
              <div className="flex-shrink-0 w-16 flex items-start justify-center">
                <div className="w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl z-10">
                  {item.icon || (index + 1)}
                </div>
              </div>
              <div className="flex-1 pb-8">
                <Card>
                  <CardHeader>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{item.date}</div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  {item.description && <CardContent>{item.description}</CardContent>}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

