import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const RssFeeds: CollectionConfig<'rss-feeds'> = {
  slug: 'rss-feeds',
  labels: {
    singular: 'RSS Feed',
    plural: 'RSS Feeds',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'type', 'url', 'enabled', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'rss',
      options: [
        { label: 'Standard RSS', value: 'rss' },
        { label: 'Reddit', value: 'reddit' },
        { label: 'WordPress', value: 'wordpress' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
