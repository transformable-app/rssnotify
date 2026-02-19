import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BYPASS_PREFIXES = ['/admin', '/api', '/_next', '/media'] as const
const BYPASS_EXACT = new Set(['/favicon.ico', '/admin/favicon.ico', '/admin/favicon.svg'])

function shouldBypass(pathname: string): boolean {
  if (BYPASS_EXACT.has(pathname)) return true

  if (BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  // Let files from /public and other asset routes pass through.
  return /\.[^/]+$/.test(pathname)
}

export function middleware(request: NextRequest) {
  if (shouldBypass(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const redirectURL = request.nextUrl.clone()
  redirectURL.pathname = '/admin'
  redirectURL.search = ''

  return NextResponse.redirect(redirectURL)
}

export const config = {
  matcher: '/:path*',
}
