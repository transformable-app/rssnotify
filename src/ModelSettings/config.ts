import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { DEFAULT_MODEL_NAME, MODEL_RESPONSE_CONSTRAINTS } from '@/constants/modelDefaults'

export const ModelSettings: GlobalConfig = {
  slug: 'model-settings',
  label: 'Model Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
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
          'Additional system instructions prepended before the evaluation prompt. If empty, defaults to YES/NO behavior including skipping announcement and moderator posts.',
        placeholder: MODEL_RESPONSE_CONSTRAINTS,
      },
    },
  ],
}
