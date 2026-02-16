/**
 * Minimal types for template/legacy code. These collections (pages, posts, media, header, footer)
 * are not in the current Payload config; types exist so shared components still type-check.
 */

export interface LegacyMedia {
  url?: string
  alt?: string
  width?: number
  height?: number
  updatedAt?: string
  mimeType?: string
  [key: string]: unknown
}

export interface LegacyPost {
  slug?: string
  title?: string
  categories?: unknown[]
  meta?: { description?: string; image?: unknown }
  [key: string]: unknown
}

export interface LegacyPage {
  hero?: {
    type?: string
    richText?: unknown
    links?: unknown[]
    media?: unknown
    logo?: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface LegacyHeader {
  navItems?: Array<{
    link?: { type?: string; label?: string; url?: string; reference?: unknown }
  }>
  [key: string]: unknown
}

export interface LegacyFooter {
  navItems?: unknown[]
  ctaButton?: { link?: { type?: 'custom' | 'reference'; label?: string; url?: string; reference?: unknown; newTab?: boolean } }
  contactItems?: unknown[]
  jsonLd?: unknown
  ctaPreHeading?: string
  ctaHeading?: string
  ctaHeadingAccent?: string
  ctaDescription?: string
  logo?: unknown
  socialIcons?: unknown[]
  [key: string]: unknown
}

export interface LegacyForm {
  [key: string]: unknown
}
