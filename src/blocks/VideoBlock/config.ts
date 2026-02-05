import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const VideoBlock: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  fields: [
    {
      name: 'videoType',
      type: 'select',
      label: 'Video Type',
      required: true,
      defaultValue: 'youtube',
      options: [
        {
          label: 'YouTube',
          value: 'youtube',
        },
        {
          label: 'Vimeo',
          value: 'vimeo',
        },
        {
          label: 'Direct Video',
          value: 'direct',
        },
      ],
    },
    {
      name: 'videoId',
      type: 'text',
      label: 'Video ID',
      admin: {
        description: 'YouTube or Vimeo video ID (e.g., "dQw4w9WgXcQ" for YouTube)',
        condition: (_, siblingData) =>
          siblingData.videoType === 'youtube' || siblingData.videoType === 'vimeo',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      admin: {
        description: 'Direct URL to video file (e.g., .mp4, .webm)',
        condition: (_, siblingData) => siblingData.videoType === 'direct',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            HorizontalRuleFeature(),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
    },
    {
      name: 'aspectRatio',
      type: 'select',
      label: 'Aspect Ratio',
      defaultValue: '16:9',
      options: [
        {
          label: '16:9',
          value: '16:9',
        },
        {
          label: '4:3',
          value: '4:3',
        },
        {
          label: '1:1',
          value: '1:1',
        },
      ],
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Autoplay',
      defaultValue: false,
    },
    {
      name: 'width',
      type: 'select',
      label: 'Width',
      defaultValue: 'content',
      options: [
        {
          label: 'Content Width',
          value: 'content',
        },
        {
          label: 'Full Width',
          value: 'full',
        },
      ],
    },
  ],
  admin: {
    components: {
      Block: '@/components/Admin/VideoBlockPreview',
    },
  },
  labels: {
    plural: 'Videos',
    singular: 'Video',
  },
}

