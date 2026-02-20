import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Notification Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'notifications',
      type: 'group',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              required: true,
            },
            {
              name: 'fromName',
              label: 'From Name',
              type: 'text',
            },
            {
              name: 'fromEmail',
              label: 'From Email',
              type: 'email',
            },
            {
              name: 'replyTo',
              label: 'Reply-To',
              type: 'email',
            },
            {
              name: 'recipients',
              label: 'Recipients',
              type: 'array',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  required: true,
                },
              ],
              admin: {
                description: 'Email addresses that receive alert notifications.',
              },
            },
          ],
        },
        {
          name: 'ntfy',
          label: 'Ntfy',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              required: true,
            },
            {
              name: 'serverURL',
              label: 'Server URL',
              type: 'text',
              admin: {
                description: 'Base URL for your ntfy server (e.g., https://ntfy.sh).',
              },
            },
            {
              name: 'authToken',
              label: 'Auth Token',
              type: 'text',
              admin: {
                description: 'Auth token for ntfy (leave blank if not needed).',
              },
            },
            {
              name: 'channels',
              label: 'Channels',
              type: 'array',
              fields: [
                {
                  name: 'topic',
                  type: 'text',
                  required: true,
                },
              ],
              admin: {
                description: 'One or more ntfy topics to publish alerts to.',
              },
            },
          ],
        },
      ],
    },
  ],
}
