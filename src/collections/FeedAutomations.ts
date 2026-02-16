import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const FeedAutomations: CollectionConfig<'feed-automations'> = {
  slug: 'feed-automations',
  labels: {
    singular: 'Feed Automation',
    plural: 'Feed Automations',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'type', 'enabled', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
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
        { label: 'WordPress / Blog', value: 'wordpress' },
      ],
    },
    {
      name: 'feeds',
      type: 'relationship',
      relationTo: 'rss-feeds',
      hasMany: true,
      admin: {
        description: 'Optional: limit this automation to specific feeds.',
      },
    },
    {
      name: 'standardRules',
      label: 'Standard RSS Rules',
      type: 'group',
      fields: [
        {
          name: 'model',
          label: 'OpenAI model',
          type: 'text',
          admin: {
            description: 'Model name to use (e.g., gpt-4o-mini).',
          },
        },
        {
          name: 'modelPrompt',
          label: 'Model prompt',
          type: 'textarea',
        },
        {
          name: 'fetchLinkContent',
          label: 'Fetch link content when available',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'redditRules',
      label: 'Reddit Rules',
      type: 'group',
      admin: {
        condition: (data) => data?.type === 'reddit',
      },
      fields: [
        {
          name: 'followPostRss',
          label: 'Follow post URL to its .rss version',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'processComments',
          label: 'Process each comment',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'fetchLinkContent',
          label: 'Fetch link content when available',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'wordpressRules',
      label: 'WordPress / Blog RSS Rules',
      type: 'group',
      admin: {
        condition: (data) => data?.type === 'wordpress',
      },
      fields: [
        {
          name: 'followPostRss',
          label: 'Follow post URL to its .rss version',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'processComments',
          label: 'Process each comment',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'fetchLinkContent',
          label: 'Fetch link content when available',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
