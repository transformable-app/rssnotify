import type { Block } from 'payload'

export const ProcessBlock: Block = {
  slug: 'process',
  interfaceName: 'ProcessBlock',
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'Small text above the title (e.g. "OUR PROCESS")',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      admin: {
        description: 'Main heading (e.g. "STREAMLINING CREATIVITY WITH CUTTING EDGE STRATEGY")',
      },
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      minRows: 1,
      fields: [
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Background image',
          admin: {
            description: 'Optional image or texture behind the step content',
          },
        },
        {
          name: 'number',
          type: 'number',
          label: 'Step number',
          required: true,
          min: 1,
          admin: {
            description: 'Displayed as 01, 02, 03, etc.',
          },
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
        {
          name: 'accentColor',
          type: 'select',
          label: 'Accent color',
          defaultValue: 'orange',
          options: [
            { label: 'Orange', value: 'orange' },
            { label: 'Teal', value: 'teal' },
            { label: 'Green', value: 'green' },
          ],
          admin: {
            description: 'Block background tint when no image is set',
          },
        },
        {
          name: 'link',
          type: 'group',
          label: 'Link',
          admin: {
            description: 'Optional. Leave empty for no link.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'type',
                  type: 'radio',
                  admin: { layout: 'horizontal', width: '50%' },
                  defaultValue: 'reference',
                  options: [
                    { label: 'Internal link', value: 'reference' },
                    { label: 'Custom URL', value: 'custom' },
                  ],
                },
                {
                  name: 'newTab',
                  type: 'checkbox',
                  admin: { style: { alignSelf: 'flex-end' }, width: '50%' },
                  label: 'Open in new tab',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'reference',
                  type: 'relationship',
                  relationTo: ['pages', 'posts'],
                  label: 'Document to link to',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'reference' },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'Custom URL',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'custom' },
                },
                {
                  name: 'label',
                  type: 'text',
                  label: 'Label',
                  admin: { description: 'e.g. "Read more"' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  labels: {
    plural: 'Process Blocks',
    singular: 'Process Block',
  },
}
