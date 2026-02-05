import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable optimization in production when behind nginx proxy
    // This avoids the 'url' query parameter issue that nginx blocks
    // Images will still load but without Next.js optimization
    unoptimized: process.env.NODE_ENV === 'production',
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL, 'https://payloadcms.3twenty9.com']
        .filter(Boolean)
        .map((item) => {
          try {
            const url = new URL(item)

            return {
              hostname: url.hostname,
              protocol: url.protocol.replace(':', ''),
            }
          } catch {
            return null
          }
        })
        .filter(Boolean),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
