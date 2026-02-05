import type { Block } from 'payload'

import { link } from '@/fields/link'

export const PricingBlock: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  fields: [
    {
      name: 'plans',
      type: 'array',
      label: 'Pricing Plans',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Plan Name',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          label: 'Price',
          required: true,
        },
        {
          name: 'period',
          type: 'text',
          label: 'Period',
          defaultValue: '/month',
          admin: {
            description: 'e.g., "/month", "/year", "/one-time"',
          },
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
        },
        {
          name: 'features',
          type: 'array',
          label: 'Features',
          fields: [
            {
              name: 'feature',
              type: 'text',
              label: 'Feature',
              required: true,
            },
          ],
        },
        {
          name: 'highlighted',
          type: 'checkbox',
          label: 'Highlighted Plan',
          defaultValue: false,
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Button Text',
          defaultValue: 'Get Started',
        },
        link({
          overrides: {
            name: 'buttonLink',
            label: 'Button Link',
          },
        }),
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
      Block: '@/components/Admin/PricingBlockPreview',
    },
  },
  labels: {
    plural: 'Pricing Tables',
    singular: 'Pricing Table',
  },
}

