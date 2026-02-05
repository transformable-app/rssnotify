import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
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
    },
    {
      name: 'gap',
      type: 'select',
      label: 'Gap Size',
      defaultValue: 'md',
      options: [
        {
          label: 'Small',
          value: 'sm',
        },
        {
          label: 'Medium',
          value: 'md',
        },
        {
          label: 'Large',
          value: 'lg',
        },
      ],
    },
    {
      name: 'aspectRatio',
      type: 'select',
      label: 'Aspect Ratio',
      defaultValue: 'square',
      options: [
        {
          label: 'Square',
          value: 'square',
        },
        {
          label: 'Landscape',
          value: 'landscape',
        },
        {
          label: 'Portrait',
          value: 'portrait',
        },
        {
          label: 'Auto',
          value: 'auto',
        },
      ],
    },
    {
      name: 'lightbox',
      type: 'checkbox',
      label: 'Enable Lightbox',
      defaultValue: false,
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
      Block: '@/components/Admin/GalleryBlockPreview',
    },
  },
  labels: {
    plural: 'Galleries',
    singular: 'Gallery',
  },
}

