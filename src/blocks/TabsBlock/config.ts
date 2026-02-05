import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const TabsBlock: Block = {
  slug: 'tabs',
  interfaceName: 'TabsBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Tab Items',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Tab Label',
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
      name: 'defaultValue',
      type: 'text',
      label: 'Default Tab',
      admin: {
        description: 'ID of the tab to show by default (leave empty for first tab)',
      },
    },
    {
      name: 'orientation',
      type: 'select',
      label: 'Orientation',
      defaultValue: 'horizontal',
      options: [
        {
          label: 'Horizontal',
          value: 'horizontal',
        },
        {
          label: 'Vertical',
          value: 'vertical',
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
    plural: 'Tabs',
    singular: 'Tabs',
  },
}

