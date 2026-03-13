import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const AutomationHistory: CollectionConfig<'automation-history'> = {
  slug: 'automation-history',
  labels: {
    singular: 'Automation History Entry',
    plural: 'Automation History',
  },
  access: {
    create: () => false,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'sourceURL', 'status', 'retryCount', 'nextRetryAt', 'reason', 'processedAt'],
    useAsTitle: 'title',
    components: {
      edit: {
        beforeDocumentControls: ['@/components/Admin/OpenSourceURLButton'],
      },
    },
  },
  fields: [
    {
      name: 'itemKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable dedupe key for a feed item within a specific automation.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'ignored',
      options: [
        { label: 'Notified', value: 'notified' },
        { label: 'Ignored', value: 'ignored' },
      ],
    },
    {
      name: 'reason',
      type: 'text',
      admin: {
        description: 'Why this item ended up with its recorded status.',
      },
    },
    {
      name: 'automation',
      type: 'relationship',
      relationTo: 'feed-automations',
      required: true,
    },
    {
      name: 'feed',
      type: 'relationship',
      relationTo: 'rss-feeds',
      required: true,
    },
    {
      name: 'sourceURL',
      label: 'Source URL',
      type: 'text',
      index: true,
      admin: {
        components: {
          Cell: '@/components/Admin/NotificationsSourceUrlCell',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'matchedAt',
      type: 'date',
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'attemptCount',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        description: 'Total number of evaluation attempts for this item.',
      },
    },
    {
      name: 'retryCount',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'How many retries were attempted after the initial ignored result.',
      },
    },
    {
      name: 'nextRetryAt',
      type: 'date',
      admin: {
        description: 'When this ignored item becomes eligible for another evaluation.',
      },
    },
    {
      name: 'retryExhausted',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'notification',
      type: 'relationship',
      relationTo: 'notifications',
    },
    {
      name: 'checks',
      type: 'array',
      admin: {
        description: 'Chronological log of each evaluation attempt for this item.',
      },
      fields: [
        {
          name: 'checkedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: [
            { label: 'Notified', value: 'notified' },
            { label: 'Ignored', value: 'ignored' },
          ],
        },
        {
          name: 'reason',
          type: 'text',
        },
        {
          name: 'attemptNumber',
          type: 'number',
          required: true,
        },
        {
          name: 'retryNumber',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
        {
          name: 'nextRetryAt',
          type: 'date',
        },
        {
          name: 'notification',
          type: 'relationship',
          relationTo: 'notifications',
        },
      ],
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'Raw processing payload for debugging and auditing.',
      },
    },
  ],
  timestamps: true,
}
