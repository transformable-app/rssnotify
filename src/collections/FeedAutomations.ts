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
          name: 'matchMode',
          type: 'select',
          defaultValue: 'contains',
          options: [
            { label: 'Contains', value: 'contains' },
            { label: 'Regex', value: 'regex' },
          ],
        },
        {
          name: 'matchString',
          type: 'text',
          admin: {
            description: 'String or regex pattern to match against feed item content.',
          },
        },
        {
          name: 'useModel',
          label: 'Evaluate with model',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'model',
          label: 'OpenAI model',
          type: 'text',
          admin: {
            condition: (data, siblingData) => Boolean(siblingData?.useModel),
            description: 'Model name to use (e.g., gpt-4o-mini).',
          },
        },
        {
          name: 'modelPrompt',
          label: 'Model prompt',
          type: 'textarea',
          admin: {
            condition: (data, siblingData) => Boolean(siblingData?.useModel),
          },
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
