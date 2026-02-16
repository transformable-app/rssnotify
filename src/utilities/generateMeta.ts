import type { Metadata } from 'next'

import type { Config } from '../payload-types'
import type { LegacyMedia } from '@/types/legacy'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: LegacyMedia | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const img = image as { sizes?: { og?: { url?: string } }; url?: string }
    const ogUrl = img.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + (img.url ?? '')
  }

  return url
}

export const generateMeta = async (args: {
  doc: { meta?: { image?: unknown; title?: string; description?: string }; slug?: string | string[] } | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image as LegacyMedia | null | undefined)

  const title = doc?.meta?.title ? doc?.meta?.title + ' | rssnotify' : 'rssnotify'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
