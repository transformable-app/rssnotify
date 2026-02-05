import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Mail,
  Phone,
  Globe,
  Music,
  MessageCircle,
  Send,
} from 'lucide-react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'

const socialIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  tiktok: Music,
  pinterest: Send,
  snapchat: MessageCircle,
  discord: MessageCircle,
  email: Mail,
  website: Globe,
}

const contactIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  other: Globe,
}

export async function Footer() {
  const footerData = (await getCachedGlobal('footer', 1)()) as Footer

  const navItems = footerData?.navItems || []
  const socialIcons = footerData?.socialIcons || []
  const jsonLd = footerData?.jsonLd || null

  const ctaButtonLink = footerData?.ctaButton?.link
  const hasCtaButton = ctaButtonLink?.label && (ctaButtonLink.url || ctaButtonLink.reference)
  const contactItems = footerData?.contactItems ?? []
  const hasCta =
    Boolean(footerData?.ctaPreHeading) ||
    Boolean(footerData?.ctaHeading) ||
    Boolean(footerData?.ctaHeadingAccent) ||
    Boolean(footerData?.ctaDescription) ||
    hasCtaButton ||
    contactItems.length > 0

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd),
          }}
        />
      )}
      {hasCta && (
        <section
          className="border-t border-border bg-[#271d02] text-[#f5f0e6]"
          aria-label="Call to action"
        >
          <div className="container py-12 md:py-16 flex flex-col items-center text-center gap-8">
            {(footerData?.ctaPreHeading || footerData?.ctaHeading || footerData?.ctaHeadingAccent) && (
              <div className="flex flex-col gap-3">
                {footerData.ctaPreHeading && (
                  <p className="text-sm font-medium uppercase tracking-widest text-orange-500">
                    {footerData.ctaPreHeading}
                  </p>
                )}
                {(footerData.ctaHeading || footerData.ctaHeadingAccent) && (
                  <h2 className="font-anton text-4xl md:text-6xl lg:text-7xl font-normal uppercase tracking-tight">
                    {footerData.ctaHeading && <span>{footerData.ctaHeading}</span>}
                    {(footerData.ctaHeading && footerData.ctaHeadingAccent) && <br />}
                    {footerData.ctaHeadingAccent && (
                      <span className="text-orange-500">{footerData.ctaHeadingAccent}</span>
                    )}
                  </h2>
                )}
              </div>
            )}
            {footerData?.ctaDescription && (
              <p className="text-base md:text-lg max-w-2xl text-[#e8e4dc]">
                {footerData.ctaDescription}
              </p>
            )}
            {hasCtaButton && ctaButtonLink && (
              <CMSLink
                type={ctaButtonLink.type ?? 'custom'}
                url={ctaButtonLink.type === 'custom' ? ctaButtonLink.url ?? undefined : undefined}
                reference={ctaButtonLink.type === 'reference' ? ctaButtonLink.reference ?? undefined : undefined}
                label={`${ctaButtonLink.label} →`}
                newTab={ctaButtonLink.newTab ?? false}
                appearance="default"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold uppercase text-white transition-colors hover:bg-orange-600"
              />
            )}
            {hasCtaButton && contactItems.length > 0 && (
              <hr className="w-full max-w-2xl border-[#3d3520]" />
            )}
            {contactItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {contactItems.map((item, i) => {
                  if (!item?.label || !item?.value) return null
                  const Icon = contactIconMap[item.type ?? 'other'] ?? Globe
                  const href =
                    item.type === 'email' ? `mailto:${item.value}` : item.type === 'phone' ? `tel:${item.value}` : undefined
                  const content = (
                    <>
                      <Icon className="h-5 w-5 shrink-0 text-orange-500" />
                      <div className="text-left">
                        <p className="text-xs font-medium uppercase tracking-widest text-[#c9c4b8]">
                          {item.label}
                        </p>
                        <p className="text-[#f5f0e6] font-medium">{item.value}</p>
                      </div>
                    </>
                  )
                  const wrapperClass =
                    'flex items-center gap-4 rounded-xl border border-[#3d3520] bg-[#2b2309] p-4 text-[#f5f0e6]'
                  return href ? (
                    <a key={i} href={href} className={`${wrapperClass} hover:border-orange-500/50 transition-colors`}>
                      {content}
                    </a>
                  ) : (
                    <div key={i} className={wrapperClass}>
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}
      <footer className="mt-auto border-t border-[#3d3520] bg-[#271d02] text-white">
        <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
          <Link className="flex items-center justify-center md:justify-start" href="/">
            {footerData?.logo && typeof footerData.logo === 'object' ? (
              <Media
                resource={footerData.logo}
                imgClassName="max-w-[9.375rem] w-full h-[34px]"
                priority
                loading="eager"
              />
            ) : (
              <Logo />
            )}
          </Link>

          <div className="flex flex-col-reverse items-center md:items-start md:flex-row gap-4 md:items-center">
            <div className="[&_*]:!text-white">
              <ThemeSelector />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <nav className="flex flex-col md:flex-row gap-4">
                {navItems.map(({ link }, i) => {
                  return <CMSLink className="text-white" key={i} {...link} />
                })}
              </nav>
              {socialIcons.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialIcons.map((social, i) => {
                    if (!social?.platform || !social?.url) return null
                    const IconComponent = socialIconMap[social.platform] || Globe
                    return (
                      <a
                        key={i}
                        href={social.url}
                        target={social.newTab ? '_blank' : '_self'}
                        rel={social.newTab ? 'noopener noreferrer' : undefined}
                        className="text-white hover:text-gray-300 transition-colors"
                        aria-label={social.platform}
                      >
                        <IconComponent className="w-5 h-5" />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
