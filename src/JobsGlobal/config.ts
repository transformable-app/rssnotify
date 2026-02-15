import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const JobsGlobal: GlobalConfig = {
  slug: 'jobs',
  label: 'Jobs',
  admin: {
    group: 'Settings',
    components: {
      views: {
        edit: {
          default: {
            Component: '@/components/Admin/JobsScheduleView',
          },
        },
      },
    },
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [],
}
