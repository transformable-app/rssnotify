import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>
          Welcome to rssnotify!{' '}
          <a
            href="https://github.com/transformable-app/rssnotify"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/transformable-app/rssnotify
          </a>
        </h4>
      </Banner>
    </div>
  )
}

export default BeforeDashboard
