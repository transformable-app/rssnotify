import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentColumnItem = {
  id?: string
  title?: string
  description?: string
  content?: React.ReactNode
  image?: string
}

export type ContentColumnsProps = {
  items: ContentColumnItem[]
  className?: string
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export const ContentColumns: React.FC<ContentColumnsProps> = ({
  items,
  className,
  columns = 3,
  gap = 'md',
}) => {
  if (!items || items.length === 0) {
    return null
  }

  const gridCols = {
    1: 'grid-cols-1',
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
          <Card key={item.id || index} className="h-full">
            {item.image && (
              <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                <Image
                  src={item.image}
                  alt={item.title || ''}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            <CardHeader>
              {item.title && <CardTitle>{item.title}</CardTitle>}
              {item.description && <CardDescription>{item.description}</CardDescription>}
            </CardHeader>
            {item.content && <CardContent>{item.content}</CardContent>}
          </Card>
        ))}
      </div>
    </div>
  )
}

