import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentFeatureItem = {
  id?: string
  title: string
  description: React.ReactNode
  icon?: string
}

export type ContentFeaturesProps = {
  items: ContentFeatureItem[]
  className?: string
  layout?: 'grid' | 'list'
  columns?: 2 | 3 | 4
}

export const ContentFeatures: React.FC<ContentFeaturesProps> = ({
  items,
  className,
  layout = 'grid',
  columns = 3,
}) => {
  if (!items || items.length === 0) {
    return null
  }

  if (layout === 'list') {
    return (
      <div className={cn('w-full', className)}>
        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={item.id || index}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {item.icon && <div className="text-3xl flex-shrink-0">{item.icon}</div>}
                  <div className="flex-1">
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>{item.description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', gridCols[columns], 'gap-6')}>
        {items.map((item, index) => (
          <Card key={item.id || index} className="h-full">
            <CardHeader>
              <div className="flex items-start gap-3">
                {item.icon && <div className="text-3xl flex-shrink-0">{item.icon}</div>}
                <CardTitle className="flex-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>{item.description}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

