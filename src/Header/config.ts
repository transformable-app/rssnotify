import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    hidden: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo displayed in the header. If not set, the default Payload logo will be used.',
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Favicon (.ico file). If not set, the default favicon.ico will be used.',
      },
    },
    {
      name: 'appleTouchIcon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Apple touch icon (typically 180x180 PNG). If not set, no apple touch icon will be used.',
      },
    },
    {
      name: 'headerScripts',
      type: 'code',
      admin: {
        description: 'Custom scripts to include in the <head> section (e.g., analytics, tracking codes).',
        language: 'html',
      },
    },
    {
      name: 'metaTags',
      type: 'code',
      admin: {
        description: 'Meta tags to include in the <head> section (e.g., Google verification, Bing verification).',
        language: 'html',
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
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
