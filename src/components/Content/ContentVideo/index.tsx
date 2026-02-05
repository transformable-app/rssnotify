import React from 'react'
import { cn } from '@/utilities/ui'

export type ContentVideoProps = {
  videoType: 'youtube' | 'vimeo' | 'direct'
  videoId?: string
  videoUrl?: string
  title?: string
  description?: React.ReactNode
  aspectRatio?: '16:9' | '4:3' | '1:1'
  autoplay?: boolean
  className?: string
}

export const ContentVideo: React.FC<ContentVideoProps> = ({
  videoType,
  videoId,
  videoUrl,
  title,
  description,
  aspectRatio = '16:9',
  autoplay = false,
  className,
}) => {
  const aspectRatios = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }

  const getEmbedUrl = () => {
    if (videoType === 'youtube' && videoId) {
      const autoplayParam = autoplay ? '&autoplay=1' : ''
      return `https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}`
    }
    if (videoType === 'vimeo' && videoId) {
      const autoplayParam = autoplay ? '&autoplay=1' : ''
      return `https://player.vimeo.com/video/${videoId}?${autoplayParam}`
    }
    return null
  }

  const embedUrl = getEmbedUrl()

  if (videoType === 'direct' && videoUrl) {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <div className="mb-4">
            <h3 className="text-2xl font-semibold mb-2">{title}</h3>
            {description && <div className="text-muted-foreground">{description}</div>}
          </div>
        )}
        <div className={cn('relative w-full overflow-hidden rounded-lg', aspectRatios[aspectRatio])}>
          <video
            src={videoUrl}
            controls
            autoPlay={autoplay}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-2xl font-semibold mb-2">{title}</h3>
          {description && <div className="text-muted-foreground">{description}</div>}
        </div>
      )}
      <div className={cn('relative w-full overflow-hidden rounded-lg', aspectRatios[aspectRatio])}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video embed'}
        />
      </div>
    </div>
  )
}

