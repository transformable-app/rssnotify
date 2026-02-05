'use client'

import React from 'react'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/utilities/ui'
import { ContentCarousel, type ContentCarouselItem } from '@/components/Content/ContentCarousel'

export type ContentTestimonialItem = {
  id?: string
  quote: React.ReactNode
  author: string
  role?: string
  company?: string
  image?: string
}

export type ContentTestimonialsProps = {
  items: ContentTestimonialItem[]
  className?: string
  layout?: 'grid' | 'carousel'
  columns?: 1 | 2 | 3
}

export const ContentTestimonials: React.FC<ContentTestimonialsProps> = ({
  items,
  className,
  layout = 'grid',
  columns = 3,
}) => {
  if (!items || items.length === 0) {
    return null
  }

  if (layout === 'carousel') {
    const carouselItems: ContentCarouselItem[] = items.map((item) => ({
      id: item.id,
      title: item.author,
      description: item.role || item.company,
      content: item.quote,
      image: item.image,
    }))

    return (
      <div className={cn('w-full', className)}>
        <ContentCarousel items={carouselItems} showNavigation={true} />
      </div>
    )
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', gridCols[columns], 'gap-6')}>
        {items.map((item, index) => (
          <Card key={item.id || index} className="h-full flex flex-col">
            <CardHeader className="flex-1">
              <div className="text-lg italic mb-4">{item.quote}</div>
            </CardHeader>
            <CardFooter className="flex items-center gap-3 pt-0">
              {item.image && (
                <Avatar>
                  <AvatarImage src={item.image} alt={item.author} />
                  <AvatarFallback>
                    {item.author
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <div className="font-semibold">{item.author}</div>
                {(item.role || item.company) && (
                  <div className="text-sm text-muted-foreground">
                    {[item.role, item.company].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

