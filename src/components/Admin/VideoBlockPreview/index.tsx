'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentVideo } from '@/components/Content/ContentVideo'

export type VideoBlockPreviewProps = {
  videoType?: 'youtube' | 'vimeo' | 'direct'
  videoId?: string
  videoUrl?: string
  title?: string
  description?: unknown
  aspectRatio?: '16:9' | '4:3' | '1:1'
  autoplay?: boolean
  width?: 'content' | 'full'
}

export const VideoBlockPreview: React.FC<VideoBlockPreviewProps> = (props) => {
  const {
    videoType,
    videoId,
    videoUrl,
    title,
    description,
    aspectRatio = '16:9',
    autoplay = false,
    width = 'content',
  } = props

  if (!videoType) {
    return (
      <Banner type="info">
        <p>No video type selected. Please select a video type.</p>
      </Banner>
    )
  }

  if ((videoType === 'youtube' || videoType === 'vimeo') && !videoId) {
    return (
      <Banner type="info">
        <p>No video ID configured. Please add a video ID to see the preview.</p>
      </Banner>
    )
  }

  if (videoType === 'direct' && !videoUrl) {
    return (
      <Banner type="info">
        <p>No video URL configured. Please add a video URL to see the preview.</p>
      </Banner>
    )
  }

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Video Preview ({videoType}, {aspectRatio}) - Width: {width === 'content' ? 'Content' : 'Full'}
          {autoplay && ' - Autoplay enabled'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentVideo
          videoType={videoType}
          videoId={videoId}
          videoUrl={videoUrl}
          title={title}
          description={description ? (
            <div>{typeof description === 'string' ? description : 'Rich text content'}</div>
          ) : undefined}
          aspectRatio={aspectRatio}
          autoplay={autoplay}
        />
      </div>
    </div>
  )
}

export default VideoBlockPreview

