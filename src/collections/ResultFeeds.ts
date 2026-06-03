import type { CollectionConfig, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { randomBytes } from 'crypto'

import { authenticated } from '../access/authenticated'
import { renderResultFeed } from '../jobs/resultFeeds'

const resultStatuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped', value: 'skipped' },
]

const resultFeedEndpoint = (format: 'atom' | 'rss' | 'configured') => ({
  path: format === 'configured' ? '/:id/feed.xml' : `/:id/feed.${format}`,
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    const id = typeof req.routeParams?.id === 'string' ? req.routeParams.id : ''
    if (!id) {
      throw new APIError('Result feed not found.', 404)
    }

    return renderResultFeed({
      req,
      id,
      requestedFormat: format,
    })
  },
})

export const ResultFeeds: CollectionConfig = {
  slug: 'result-feeds',
  labels: {
    singular: 'Result Feed',
    plural: 'Result Feeds',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'resultType', 'visibility', 'enabled', 'updatedAt'],
    description:
      'Public or private Atom/RSS feeds of generated notification and digest results. Public feeds are unprotected; private feeds require the tokenized URL.',
    useAsTitle: 'name',
  },
  endpoints: [
    resultFeedEndpoint('configured'),
    resultFeedEndpoint('atom'),
    resultFeedEndpoint('rss'),
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.token) {
          data.token = randomBytes(24).toString('base64url')
        }
        return data
      },
    ],
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
      name: 'resultType',
      label: 'Result type',
      type: 'select',
      required: true,
      defaultValue: 'notifications',
      options: [
        { label: 'Notifications', value: 'notifications' },
        { label: 'Digests', value: 'digests' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
      admin: {
        description: 'Public feeds are visible to anyone with the URL. Private feeds require the token.',
      },
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      admin: {
        description: 'Secret token required for private feed URLs. Rotate by replacing this value.',
      },
    },
    {
      name: 'format',
      type: 'select',
      required: true,
      defaultValue: 'atom',
      options: [
        { label: 'Atom', value: 'atom' },
        { label: 'RSS', value: 'rss' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      required: true,
      defaultValue: 50,
      min: 1,
      max: 200,
    },
    {
      name: 'automations',
      type: 'relationship',
      relationTo: 'feed-automations',
      hasMany: true,
      admin: {
        condition: (data) => data?.resultType === 'notifications',
        description: 'Optional. Limit notification feeds to selected automations.',
      },
    },
    {
      name: 'feeds',
      type: 'relationship',
      relationTo: 'rss-feeds',
      hasMany: true,
      admin: {
        condition: (data) => data?.resultType === 'notifications',
        description: 'Optional. Limit notification feeds to selected source feeds.',
      },
    },
    {
      name: 'digests',
      type: 'relationship',
      relationTo: 'digests',
      hasMany: true,
      admin: {
        condition: (data) => data?.resultType === 'digests',
        description: 'Optional. Limit digest feeds to selected digest definitions.',
      },
    },
    {
      name: 'statuses',
      type: 'select',
      hasMany: true,
      options: resultStatuses,
      admin: {
        description:
          'Optional. Notification feeds default to sent results. Digest feeds default to sent digest runs.',
      },
    },
    {
      name: 'includeContent',
      label: 'Include content',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'lastAccessedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
