'use client'

import { Logout } from '@payloadcms/ui'
import packageJson from '../../../../package.json'

const releasesUrl = 'https://github.com/transformable-app/rssnotify/releases'

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
        <Logout />
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
