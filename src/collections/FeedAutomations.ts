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
      label: 'RSS Rules',
      type: 'group',
      fields: [
        {
          name: 'model',
          label: 'OpenAI model',
          type: 'text',
          admin: {
            description: 'Model name to use (e.g., gpt-5-nano, openai/gpt-oss-120b, qwen/qwen3-next-80b).',
          },
        },
        {
          name: 'modelPrompt',
          label: 'Model prompt',
          type: 'textarea',
          admin: {
            description:
              'Use "Yes" and "No" in the prompt to guide the AI in deciding whether to send a notification based on the RSS feed item content.',
            placeholder:
              'Yes if post is about self hosted open source apps. No if post is about self hosted email.',
          },
        },
        {
          name: 'notifyEveryPost',
          label: 'Notify me of every post, no evaluation',
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
      ],
    },
  ],
}
