import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { DEFAULT_MODEL_BASE_PROMPT, DEFAULT_MODEL_NAME } from '@/constants/modelDefaults'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'modelSettings',
      label: 'Model Settings',
      type: 'group',
      fields: [
        {
          name: 'defaultModel',
          label: 'Default model',
          type: 'text',
          admin: {
            description:
              'Used when an automation does not set its own model. Falls back to the MODEL_NAME env var, then gpt-5-nano.',
            placeholder: DEFAULT_MODEL_NAME,
          },
        },
        {
          name: 'systemPrompt',
          label: 'System prompt',
          type: 'textarea',
          admin: {
            description:
              'Additional system instructions prepended before the evaluation prompt.',
            placeholder: DEFAULT_MODEL_BASE_PROMPT,
          },
        },
      ],
    },
    {
      name: 'firecrawl',
      label: 'Firecrawl',
      type: 'group',
      fields: [
        {
              name: 'host',
              label: 'Host',
              type: 'text',
              admin: {
                description:
                  'Optional Firecrawl base URL used for RSS retrieval, for example https://api.firecrawl.dev or http://localhost:3001.',
              },
            },
        {
          name: 'token',
          label: 'Token',
          type: 'text',
          admin: {
            description: 'Optional Firecrawl auth token. Leave blank for self-hosted instances that do not require one.',
          },
        },
      ],
    },
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
