import type React from 'react'
import type { LegacyPage, LegacyPost } from '@/types/legacy'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string
}

type RedirectItem = {
  from?: string
  to?: { url?: string; reference?: { relationTo?: string; value?: unknown } }
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = (await getCachedRedirects()()) as RedirectItem[]

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    let redirectUrl: string

    if (typeof redirectItem.to?.reference?.value === 'string') {
      const collection = redirectItem.to?.reference?.relationTo
      const id = redirectItem.to?.reference?.value
      if (collection && id) {
        const document = (await getCachedDocument(
          collection as Parameters<typeof getCachedDocument>[0],
          id,
        )()) as unknown as LegacyPage | LegacyPost
        redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
          document?.slug ?? ''
        }`
      } else {
        redirectUrl = ''
      }
    } else {
      redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
        typeof redirectItem.to?.reference?.value === 'object' && redirectItem.to?.reference?.value !== null
          ? (redirectItem.to.reference.value as { slug?: string }).slug ?? ''
          : ''
      }`
    }

    if (redirectUrl) redirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}
