import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const QuoteBlock: Block = {
  slug: 'quote',
  interfaceName: 'QuoteBlock',
  fields: [
    {
      name: 'quote',
      type: 'richText',
      label: 'Quote',
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
      name: 'author',
      type: 'text',
      label: 'Author Name',
    },
    {
      name: 'role',
      type: 'text',
      label: 'Role',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Company',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Author Image',
    },
    {
      name: 'style',
      type: 'select',
      label: 'Style',
      defaultValue: 'default',
      options: [
        {
          label: 'Default',
          value: 'default',
        },
        {
          label: 'Large',
          value: 'large',
        },
        {
          label: 'Minimal',
          value: 'minimal',
        },
      ],
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
  labels: {
    plural: 'Quotes',
    singular: 'Quote',
  },
}

