import type { LegacyPage } from '@/types/legacy'

// Used for pre-seeded content so that the homepage is not empty (pages collection not in config)
export const homeStatic: LegacyPage = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'none',
  },
  meta: {
    description: 'An open-source website built with Payload and Next.js.',
    title: 'rssnotify',
  },
  title: 'Home',
  layout: [],
}
