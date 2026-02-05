import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const AccordionBlock: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Accordion Items',
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
          type: 'text',
          label: 'Description',
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content',
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
  labels: {
    plural: 'Accordions',
    singular: 'Accordion',
  },
}

