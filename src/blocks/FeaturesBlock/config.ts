import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const FeaturesBlock: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Features',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'description',
          type: 'richText',
          label: 'Description',
          required: true,
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
          name: 'icon',
          type: 'text',
          label: 'Icon (emoji or text)',
          admin: {
            description: 'Optional emoji or icon text to display',
          },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      defaultValue: 'grid',
      options: [
        {
          label: 'Grid',
          value: 'grid',
        },
        {
          label: 'List',
          value: 'list',
        },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Number of Columns',
      defaultValue: '3',
      options: [
        {
          label: '2 Columns',
          value: '2',
        },
        {
          label: '3 Columns',
          value: '3',
        },
        {
          label: '4 Columns',
          value: '4',
        },
      ],
      admin: {
        condition: (_, siblingData) => siblingData.layout === 'grid',
      },
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
      Block: '@/components/Admin/FeaturesBlockPreview',
    },
  },
  labels: {
    plural: 'Features',
    singular: 'Feature',
  },
}

