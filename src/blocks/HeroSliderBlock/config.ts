import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const HeroSliderBlock: Block = {
  slug: 'heroSlider',
  interfaceName: 'HeroSliderBlock',
  labels: {
    singular: 'Hero Slider',
    plural: 'Hero Sliders',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      labels: {
        singular: 'Slide',
        plural: 'Slides',
      },
      minRows: 1,
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
          label: 'Content',
        },
        linkGroup({
          overrides: {
            maxRows: 2,
          },
        }),
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          label: 'Background',
          required: true,
          admin: {
            description: 'Background image for this slide.',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: {
            description: 'Logo shown on the right side of the slide.',
          },
        },
      ],
    },
    {
      name: 'showNavigation',
      type: 'checkbox',
      label: 'Show navigation arrows',
      defaultValue: true,
    },
    {
      name: 'loop',
      type: 'checkbox',
      label: 'Infinite loop',
      defaultValue: true,
      admin: {
        description: 'When enabled, slides wrap from last to first and vice versa.',
      },
    },
    {
      name: 'autoPlay',
      type: 'checkbox',
      label: 'Auto-advance slides',
      defaultValue: true,
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      label: 'Autoplay delay (ms)',
      defaultValue: 5000,
      admin: {
        condition: (_, siblingData) => siblingData.autoPlay === true,
      },
      min: 2000,
      max: 15000,
    },
  ],
}
