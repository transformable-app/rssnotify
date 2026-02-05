import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentVideo } from '@/components/Content/ContentVideo'
import RichText from '@/components/RichText'

type VideoBlockProps = {
  id?: string
  videoType?: 'youtube' | 'vimeo' | 'direct'
  videoId?: string
  videoUrl?: string
  title?: string
  description?: DefaultTypedEditorState
  aspectRatio?: '16:9' | '4:3' | '1:1'
  autoplay?: boolean
  width?: 'content' | 'full'
  blockType?: 'video'
}

export const VideoBlock: React.FC<VideoBlockProps> = (props) => {
  const { id, videoType, videoId, videoUrl, title, description, aspectRatio, autoplay, width = 'content' } =
    props

  if (!videoType) {
    return null
  }

  if ((videoType === 'youtube' || videoType === 'vimeo') && !videoId) {
    return null
  }

  if (videoType === 'direct' && !videoUrl) {
    return null
  }

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentVideo
        videoType={videoType}
        videoId={videoId}
        videoUrl={videoUrl}
        title={title}
        description={description ? <RichText data={description} enableGutter={false} /> : undefined}
        aspectRatio={aspectRatio}
        autoplay={autoplay}
      />
    </div>
  )
}

