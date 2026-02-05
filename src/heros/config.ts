import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

const richTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

const flatHeroTypes = ['highImpact', 'mediumImpact', 'lowImpact'] as const
const sliderHeroType = 'heroSlider' as const

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        { label: 'None', value: 'none' },
        { label: 'High Impact', value: 'highImpact' },
        { label: 'Medium Impact', value: 'mediumImpact' },
        { label: 'Low Impact', value: 'lowImpact' },
        { label: 'Hero Slider', value: 'heroSlider' },
      ],
      required: true,
    },
    // --- Flat hero fields (High / Medium / Low Impact) ---
    {
      name: 'richText',
      type: 'richText',
      editor: richTextEditor,
      label: 'Content',
      admin: {
        condition: (_, siblingData) => flatHeroTypes.includes(siblingData?.type),
      },
    },
    linkGroup({
      overrides: {
        maxRows: 2,
        admin: {
          condition: (_, siblingData) => flatHeroTypes.includes(siblingData?.type),
        },
      },
    }),
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Media',
      required: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.type === 'highImpact' || siblingData?.type === 'mediumImpact',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Hero Logo',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'highImpact',
        description: 'Logo shown on the right (High Impact only).',
      },
    },
    // --- Hero Slider fields ---
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      labels: { singular: 'Slide', plural: 'Slides' },
      minRows: 1,
      admin: {
        condition: (_, siblingData) => siblingData?.type === sliderHeroType,
        description: 'Each slide has its own content, background, and optional logo.',
      },
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor: richTextEditor,
          label: 'Content',
        },
        linkGroup({
          overrides: { maxRows: 2 },
        }),
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          label: 'Background',
          required: true,
          admin: { description: 'Background image for this slide.' },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: { description: 'Logo shown on the right side of the slide.' },
        },
      ],
    },
    {
      name: 'showNavigation',
      type: 'checkbox',
      label: 'Show navigation arrows',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === sliderHeroType,
      },
    },
    {
      name: 'autoPlay',
      type: 'checkbox',
      label: 'Auto-advance slides',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === sliderHeroType,
      },
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      label: 'Autoplay delay (ms)',
      defaultValue: 5000,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.type === sliderHeroType && siblingData?.autoPlay === true,
      },
      min: 2000,
      max: 15000,
    },
  ],
  label: false,
}
