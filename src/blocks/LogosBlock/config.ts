import type { Block } from 'payload'

export const LogosBlock: Block = {
  slug: 'logos',
  interfaceName: 'LogosBlock',
  labels: {
    singular: 'Logos',
    plural: 'Logos Blocks',
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'Small text above the title (e.g. "TRUSTED BY")',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        description: 'Main heading above the logos.',
      },
    },
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      minRows: 1,
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          required: true,
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Link URL',
          admin: {
            description: 'Optional. When set, the logo links to this URL (e.g. https://example.com).',
          },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          label: 'Open link in new tab',
          defaultValue: true,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.linkUrl),
          },
        },
      ],
    },
    {
      name: 'logosAtLargestResolution',
      type: 'number',
      label: 'Logos at largest resolution',
      defaultValue: 5,
      min: 1,
      max: 8,
      admin: {
        description: 'Number of logos visible in a row at the largest screen size.',
      },
    },
    {
      name: 'useSlider',
      type: 'checkbox',
      label: 'Show as slider',
      defaultValue: false,
      admin: {
        description: 'When enabled, logos advance one at a time in a slider instead of a static grid.',
      },
    },
    {
      name: 'sliderInterval',
      type: 'number',
      label: 'Slider interval (ms)',
      defaultValue: 4000,
      min: 1000,
      max: 15000,
      admin: {
        description: 'Time in milliseconds between slide advances when slider is enabled.',
        condition: (_, siblingData) => siblingData.useSlider === true,
      },
    },
    {
      name: 'showArrows',
      type: 'checkbox',
      label: 'Show slider arrows',
      defaultValue: true,
      admin: {
        description: 'Show previous/next arrows when slider is enabled.',
        condition: (_, siblingData) => siblingData.useSlider === true,
      },
    },
  ],
}
