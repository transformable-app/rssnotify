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
            description: 'Additional system instructions prepended before the evaluation prompt.',
            placeholder: DEFAULT_MODEL_BASE_PROMPT,
          },
        },
        {
          name: 'fallbackEndpoints',
          label: 'Fallback endpoints',
          type: 'array',
          admin: {
            description:
              'Optional OpenAI-compatible fallback provider base URLs. When configured, these override the OPENAI_FALLBACK_BASE_URLS env var and each endpoint uses its own API key.',
          },
          fields: [
            {
              name: 'baseURL',
              label: 'Base URL',
              type: 'text',
              required: true,
              admin: {
                description:
                  'OpenAI-compatible provider base URL, for example https://router.example.com.',
              },
            },
            {
              name: 'apiKey',
              label: 'API key',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Bearer token used only for this fallback endpoint. The primary endpoint still uses OPENAI_API_KEY.',
              },
            },
            {
              name: 'model',
              label: 'Model',
              type: 'text',
              admin: {
                description:
                  'Optional model override for this fallback endpoint. Leave blank to use the selected default or automation model.',
                placeholder: DEFAULT_MODEL_NAME,
              },
            },
          ],
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
            description:
              'Optional Firecrawl auth token. Leave blank for self-hosted instances that do not require one.',
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
