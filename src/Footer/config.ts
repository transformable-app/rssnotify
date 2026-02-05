import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Call to Action (above footer bar)',
      admin: {
        initCollapsed: false,
        description: 'Optional CTA section and contact cards displayed above the main footer.',
      },
      fields: [
        {
          name: 'ctaPreHeading',
          type: 'text',
          label: 'Pre-heading',
          admin: {
            description: 'Small uppercase tagline (e.g. "LET\'S TALK").',
          },
        },
        {
          name: 'ctaHeading',
          type: 'text',
          label: 'Main heading',
          admin: {
            description: 'First part of the headline (e.g. "THE TIME IS NOW THE PATH IS").',
          },
        },
        {
          name: 'ctaHeadingAccent',
          type: 'text',
          label: 'Heading accent word',
          admin: {
            description: 'Word displayed in accent color (e.g. "FORWARD").',
          },
        },
        {
          name: 'ctaDescription',
          type: 'textarea',
          label: 'Description',
          admin: {
            description: 'Short supporting text below the heading.',
          },
        },
        {
          name: 'ctaButton',
          type: 'group',
          label: 'CTA button',
          required: false,
          admin: {
            description: 'Button label and link destination.',
          },
          fields: [
            link({ appearances: false }),
          ],
        },
        {
          name: 'contactItems',
          type: 'array',
          label: 'Contact cards',
          admin: {
            description: 'Email, phone, or other contact items shown in cards below the CTA.',
          },
          maxRows: 6,
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: {
                description: 'Uppercase label (e.g. "EMAIL US", "CALL US").',
              },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'Email address, phone number, or other value.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo displayed in the footer. If not set, the default Payload logo will be used.',
      },
    },
    {
      name: 'jsonLd',
      type: 'code',
      admin: {
        description: 'JSON-LD structured data for SEO.',
        language: 'json',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'socialIcons',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'GitHub', value: 'github' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Pinterest', value: 'pinterest' },
            { label: 'Snapchat', value: 'snapchat' },
            { label: 'Discord', value: 'discord' },
            { label: 'Email', value: 'email' },
            { label: 'Website', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full URL to the social media profile or page.',
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          defaultValue: true,
          label: 'Open in new tab',
        },
      ],
      maxRows: 10,
      admin: {
        initCollapsed: true,
        description: 'Social media icons with links to display in the footer.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
