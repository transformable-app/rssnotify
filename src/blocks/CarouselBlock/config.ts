import type { Block } from 'payload'

export const CarouselBlock: Block = {
  slug: 'carousel',
  interfaceName: 'CarouselBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Carousel Items',
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
        },
        {
          name: 'content',
          type: 'textarea',
          label: 'Content',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
      ],
    },
    {
      name: 'showNavigation',
      type: 'checkbox',
      label: 'Show Navigation',
      defaultValue: true,
    },
    {
      name: 'autoPlay',
      type: 'checkbox',
      label: 'Auto Play',
      defaultValue: false,
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      label: 'Autoplay Delay (milliseconds)',
      defaultValue: 4000,
      admin: {
        description: 'Time in milliseconds between slide transitions when autoplay is enabled',
        condition: (_, siblingData) => siblingData.autoPlay === true,
      },
      min: 1000,
      max: 10000,
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
      Block: '@/components/Admin/CarouselBlockPreview',
    },
  },
  labels: {
    plural: 'Carousels',
    singular: 'Carousel',
  },
}

