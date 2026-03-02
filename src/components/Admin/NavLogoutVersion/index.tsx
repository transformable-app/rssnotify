'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import packageJson from '../../../../package.json'

const releasesUrl = 'https://github.com/transformable-app/rssnotify/releases'

const iconSize = 16

const NavLogoutVersion = () => {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '0.4rem',
        margin: '0.5rem 0 0.75rem',
      }}
    >
      <span title="Log out">
        <Link
          href="/admin/logout"
          style={{
            color: 'var(--theme-elevation-500)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            padding: 'var(--base)',
            borderRadius: 'var(--border-radius-s)',
          }}
          className="nav-logout-link"
        >
          <LogOut size={iconSize} strokeWidth={2} style={{ transform: 'scaleX(-1)' }} />
        </Link>
      </span>
      <a
        href={releasesUrl}
        rel="noreferrer"
        style={{
          color: 'var(--theme-elevation-500)',
          fontSize: '0.75rem',
          lineHeight: 1,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
        target="_blank"
        title="View releases on GitHub"
      >
        rssnotify v{packageJson.version}
      </a>
    </div>
  )
}

export default NavLogoutVersion
