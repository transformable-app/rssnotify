import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const

export const Digests: CollectionConfig = {
  slug: 'digests',
  labels: {
    singular: 'Digest',
    plural: 'Digests',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'enabled', 'schedule.time', 'schedule.timezone', 'lastRunAt', 'updatedAt'],
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
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'time',
          label: 'Daily send time',
          type: 'text',
          required: true,
          defaultValue: '08:00',
          admin: {
            description: '24-hour time in HH:mm format, evaluated in the selected timezone.',
            placeholder: '08:00',
          },
        },
        {
          name: 'timezone',
          type: 'select',
          required: true,
          defaultValue: 'America/New_York',
          options: timezones.map((timezone) => ({ label: timezone, value: timezone })),
        },
      ],
    },
    {
      name: 'recipients',
      label: 'Recipient overrides',
      type: 'array',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
      admin: {
        description: 'Optional. When empty, the digest uses Settings > Notifications > Email recipients.',
      },
    },
    {
      name: 'automations',
      type: 'relationship',
      relationTo: 'feed-automations',
      hasMany: true,
      admin: {
        description: 'Optional. Limit this digest to notifications from selected automations.',
      },
    },
    {
      name: 'feeds',
      type: 'relationship',
      relationTo: 'rss-feeds',
      hasMany: true,
      admin: {
        description: 'Optional. Limit this digest to notifications from selected feeds.',
      },
    },
    {
      name: 'lookbackHours',
      label: 'Lookback hours',
      type: 'number',
      required: true,
      defaultValue: 24,
      min: 1,
      admin: {
        description: 'How far back to look for matching notifications when a digest has not run before.',
      },
    },
    {
      name: 'maxNotifications',
      label: 'Max notifications',
      type: 'number',
      required: true,
      defaultValue: 50,
      min: 1,
      admin: {
        description: 'Maximum number of notifications to include in one digest email.',
      },
    },
    {
      name: 'useAI',
      label: 'Use AI summary and priority',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'instructions',
      label: 'Digest instructions',
      type: 'textarea',
      admin: {
        description: 'Additional system prompt instructions for summarizing this digest.',
      },
    },
    {
      name: 'priorityInstructions',
      label: 'Priority instructions',
      type: 'textarea',
      admin: {
        description: 'Optional instructions for how AI should rank and group notifications.',
        placeholder:
          'Prioritize actionable, time-sensitive, security, release, outage, or high-signal items first.',
      },
    },
    {
      name: 'lastRunAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastSuccessAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
