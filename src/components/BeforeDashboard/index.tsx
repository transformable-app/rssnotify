import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { getServerSideURL } from '@/utilities/getURL'
import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  const siteURL = getServerSideURL()
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>
          Welcome to your CMS dashboard for{' '}
          <a href={siteURL} target="_blank" rel="noopener noreferrer">
            {siteURL}
          </a>
          !
        </h4>
      </Banner>
      <p>
        For support, please contact{' '}
        <a href="mailto:support@3twenty9.com">support@3twenty9.com</a>
      </p>
      {isDev && (
        <p className={`${baseClass}__seed-link`}>
          <SeedButton />
        </p>
      )}
    </div>
  )
}

export default BeforeDashboard
