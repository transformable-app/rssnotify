import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'FAQ Items',
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'text',
          label: 'Question',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          label: 'Answer',
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
      ],
    },
    {
      name: 'type',
      type: 'select',
      label: 'Type',
      defaultValue: 'single',
      options: [
        {
          label: 'Single',
          value: 'single',
        },
        {
          label: 'Multiple',
          value: 'multiple',
        },
      ],
    },
    {
      name: 'collapsible',
      type: 'checkbox',
      label: 'Collapsible',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData.type === 'single',
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
      Block: '@/components/Admin/FAQBlockPreview',
    },
  },
  labels: {
    plural: 'FAQs',
    singular: 'FAQ',
  },
}

