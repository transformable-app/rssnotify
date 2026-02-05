import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/utilities/ui'

export type ContentQuoteProps = {
  quote: React.ReactNode
  author?: string
  role?: string
  company?: string
  image?: string
  style?: 'default' | 'large' | 'minimal'
  className?: string
}

export const ContentQuote: React.FC<ContentQuoteProps> = ({
  quote,
  author,
  role,
  company,
  image,
  style = 'default',
  className,
}) => {
  if (!quote) {
    return null
  }

  const hasAuthor = author || role || company

  if (style === 'minimal') {
    return (
      <div className={cn('w-full', className)}>
        <blockquote className="text-lg italic border-l-4 border-primary pl-6 py-4">
          {quote}
        </blockquote>
        {hasAuthor && (
          <div className="mt-4 flex items-center gap-3">
            {image && (
              <Avatar>
                <AvatarImage src={image} alt={author || ''} />
                <AvatarFallback>
                  {author
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'Q'}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {author && <div className="font-semibold">{author}</div>}
              {(role || company) && (
                <div className="text-sm text-muted-foreground">
                  {[role, company].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (style === 'large') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="text-2xl md:text-3xl font-medium italic mb-6 leading-relaxed">{quote}</div>
          {hasAuthor && (
            <div className="flex items-center gap-4">
              {image && (
                <Avatar className="h-16 w-16">
                  <AvatarImage src={image} alt={author || ''} />
                  <AvatarFallback className="text-lg">
                    {author
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'Q'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                {author && <div className="text-lg font-semibold">{author}</div>}
                {(role || company) && (
                  <div className="text-muted-foreground">{[role, company].filter(Boolean).join(', ')}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        <div className="text-xl italic mb-4">{quote}</div>
      </CardContent>
      {hasAuthor && (
        <CardFooter className="flex items-center gap-3">
          {image && (
            <Avatar>
              <AvatarImage src={image} alt={author || ''} />
              <AvatarFallback>
                {author
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'Q'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            {author && <div className="font-semibold">{author}</div>}
            {(role || company) && (
              <div className="text-sm text-muted-foreground">
                {[role, company].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

