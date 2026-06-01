import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const DigestRuns: CollectionConfig = {
  slug: 'digest-runs',
  labels: {
    singular: 'Digest Run',
    plural: 'Digest Runs',
  },
  access: {
    create: () => false,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['digest', 'status', 'windowStart', 'windowEnd', 'sentAt', 'createdAt'],
    useAsTitle: 'subject',
  },
  fields: [
    {
      name: 'digest',
      type: 'relationship',
      relationTo: 'digests',
      required: true,
    },
    {
      name: 'runKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable key used to prevent duplicate sends for the same digest window.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Skipped', value: 'skipped' },
      ],
    },
    {
      name: 'windowStart',
      type: 'date',
      required: true,
    },
    {
      name: 'windowEnd',
      type: 'date',
      required: true,
    },
    {
      name: 'sentAt',
      type: 'date',
    },
    {
      name: 'notifications',
      type: 'relationship',
      relationTo: 'notifications',
      hasMany: true,
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'text',
      type: 'textarea',
    },
    {
      name: 'html',
      type: 'textarea',
    },
    {
      name: 'aiOutput',
      label: 'AI output',
      type: 'json',
      admin: {
        description: 'Structured model response and metadata used to build the digest.',
      },
    },
    {
      name: 'error',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
