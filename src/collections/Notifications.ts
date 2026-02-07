import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { authenticated } from '../access/authenticated'

export const Notifications: CollectionConfig<'notifications'> = {
  slug: 'notifications',
  labels: {
    singular: 'Notification',
    plural: 'Notifications',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'sourceURL', 'automation', 'overallStatus', 'matchedAt', 'createdAt'],
    useAsTitle: 'title',
    components: {
      list: {
        afterList: ['@/components/Admin/NotificationsDeleteAll'],
      },
    },
  },
  endpoints: [
    {
      path: '/delete-all',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          throw new APIError('Unauthorized', 401)
        }

        await req.payload.delete({
          collection: 'notifications',
          where: { id: { exists: true } },
          overrideAccess: false,
          req,
        })

        return Response.json({ ok: true })
      },
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'sourceURL',
      label: 'Source URL',
      type: 'text',
      admin: {
        components: {
          Cell: '@/components/Admin/NotificationsSourceUrlCell',
        },
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
    },
    {
      name: 'matchedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'overallStatus',
      label: 'Overall Status',
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
      name: 'delivery',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'group',
          fields: [
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
              name: 'sentAt',
              type: 'date',
            },
            {
              name: 'error',
              type: 'textarea',
            },
          ],
        },
        {
          name: 'ntfy',
          label: 'Ntfy',
          type: 'group',
          fields: [
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
              name: 'sentAt',
              type: 'date',
            },
            {
              name: 'error',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'Raw alert payload for debugging and auditing.',
      },
    },
  ],
  timestamps: true,
}
