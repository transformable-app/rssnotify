import type { AdminViewServerProps } from 'payload'

import { Link } from '@payloadcms/ui/elements/Link'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

const JobsNavLink: React.FC<AdminViewServerProps> = ({ payload, req }) => {
  const href = formatAdminURL({
    adminRoute: payload.config.routes.admin,
    path: '/jobs',
  })

  const currentPath = req?.originalUrl || req?.url || ''
  const isActive = currentPath.startsWith(href) && ['/', undefined].includes(currentPath[href.length])
  const label = (
    <>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Jobs &amp; Schedule</span>
    </>
  )

  if (currentPath === href) {
    return (
      <div className="nav__link" id="nav-jobs">
        {label}
      </div>
    )
  }

  return (
    <Link className="nav__link" href={href} id="nav-jobs" prefetch={false}>
      {label}
    </Link>
  )
}

export default JobsNavLink
