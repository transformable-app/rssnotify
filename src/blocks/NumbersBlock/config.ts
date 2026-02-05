import type { Block } from 'payload'

export const NumbersBlock: Block = {
  slug: 'numbers',
  interfaceName: 'NumbersBlock',
  labels: {
    singular: 'Numbers Block',
    plural: 'Numbers Blocks',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      label: 'Block subtitle',
      admin: {
        description: 'Small text above the title (e.g. "IMPACT")',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Block title',
      required: true,
      admin: {
        description: 'Main heading (e.g. "IMPACT BY THE NUMBERS.")',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background image',
      admin: {
        description: 'Optional background image. If not set, a solid orange background is used.',
      },
    },
    {
      name: 'numbers',
      type: 'array',
      label: 'Numbers',
      minRows: 1,
      labels: {
        singular: 'Number',
        plural: 'Numbers',
      },
      fields: [
        {
          name: 'value',
          type: 'number',
          label: 'Value',
          required: true,
          admin: {
            description: 'The number to count up to (e.g. 500, 98)',
          },
        },
        {
          name: 'suffix',
          type: 'text',
          label: 'Suffix',
          admin: {
            description: 'Optional suffix after the number (e.g. "+", "%")',
          },
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          required: true,
          admin: {
            description: 'Text shown under the number (e.g. "CREATIVE PROJECTS LAUNCHED")',
          },
        },
      ],
    },
  ],
}
