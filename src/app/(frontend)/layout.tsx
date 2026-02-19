import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode, headers } from 'next/headers'
import { getCachedGlobal } from '@/utilities/getGlobals'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

/** Header global shape (Header global not in current Payload config) */
interface HeaderType {
  metaTags?: string | null
  favicon?: { url?: string } | string | null
  appleTouchIcon?: { url?: string } | string | null
  updatedAt?: string | null
}

const defaultHeader: HeaderType = {}

const getHeaderMediaPath = (media?: { url?: string } | string | null): string | null => {
  if (media && typeof media === 'object' && typeof media.url === 'string') {
    return media.url
  }

  return null
}

const getRequestMetadataBase = async (): Promise<URL> => {
  const fallback = getServerSideURL()
  const fallbackProtocol = fallback.startsWith('https://') ? 'https' : 'http'

  try {
    const requestHeaders = await headers()
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
    const protocol =
      requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() || fallbackProtocol

    if (host) {
      return new URL(`${protocol}://${host}`)
    }
  } catch {
    // ignore and use fallback
  }

  return new URL(fallback)
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  let headerData: HeaderType = defaultHeader
  try {
    headerData = await (
      getCachedGlobal as (slug: string, depth: number) => () => Promise<HeaderType>
    )('header', 1)()
  } catch {
    // Header global not in Payload config; use defaults
  }

  const metaTags = headerData?.metaTags || null

  // Get favicon URL from Header global or fall back to default
  const favicon = getHeaderMediaPath(headerData?.favicon)

  // Get apple touch icon URL from Header global if available
  const appleTouchIcon = getHeaderMediaPath(headerData?.appleTouchIcon)

  // Determine favicon type and add cache busting
  // Use the header's updatedAt timestamp for cache busting (changes when favicon is updated)
  const faviconCacheBuster = headerData?.updatedAt
    ? new Date(headerData.updatedAt).getTime()
    : Date.now()
  
  const faviconUrl = favicon 
    ? `${favicon}${favicon.includes('?') ? '&' : '?'}v=${faviconCacheBuster}`
    : '/favicon.ico'
  const faviconIsSvg = faviconUrl.includes('.svg')
  const hasCustomFavicon = favicon !== null

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        {hasCustomFavicon ? (
          <>
            {faviconIsSvg ? (
              <link href={faviconUrl} rel="icon" type="image/svg+xml" />
            ) : (
              <link href={faviconUrl} rel="icon" sizes="32x32" />
            )}
          </>
        ) : (
          <>
            <link href="/favicon.ico" rel="icon" sizes="32x32" />
            <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
          </>
        )}
        {appleTouchIcon && <link href={appleTouchIcon} rel="apple-touch-icon" />}
        {metaTags && <div dangerouslySetInnerHTML={{ __html: metaTags }} />}
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  let headerData: HeaderType = defaultHeader
  try {
    headerData = await (
      getCachedGlobal as (slug: string, depth: number) => () => Promise<HeaderType>
    )('header', 1)()
  } catch {
    // Header global not in Payload config
  }

  // Get favicon URL from Header global
  const favicon = getHeaderMediaPath(headerData?.favicon)

  // Get apple touch icon URL from Header global if available
  const appleTouchIcon = getHeaderMediaPath(headerData?.appleTouchIcon)

  // Add cache busting to favicon
  // Use the header's updatedAt timestamp for cache busting (changes when favicon is updated)
  const faviconCacheBuster = headerData?.updatedAt
    ? new Date(headerData.updatedAt).getTime()
    : Date.now()

  const icons: Metadata['icons'] = {}
  
  if (favicon) {
    const faviconUrl = `${favicon}${favicon.includes('?') ? '&' : '?'}v=${faviconCacheBuster}`
    if (faviconUrl.includes('.svg')) {
      icons.icon = { url: faviconUrl, type: 'image/svg+xml' }
    } else {
      icons.icon = { url: faviconUrl, sizes: '32x32' }
    }
  } else {
    icons.icon = [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ]
  }

  if (appleTouchIcon) {
    icons.apple = appleTouchIcon
  }

  const metadataBase = await getRequestMetadataBase()

  return {
    metadataBase,
    icons,
    openGraph: mergeOpenGraph(),
    twitter: {
      card: 'summary_large_image',
      creator: '@payloadcms',
    },
  }
}
