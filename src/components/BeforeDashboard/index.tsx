import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExternalLink } from 'lucide-react'

import './index.scss'

const baseClass = 'before-dashboard'

const coerceUrl = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object') {
    const asRecord = value as Record<string, unknown>
    const url = typeof asRecord.url === 'string' ? asRecord.url : undefined
    const href = typeof asRecord.href === 'string' ? asRecord.href : undefined
    return (url || href || '').trim() || null
  }
  return null
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'n/a'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}...`
}

const BeforeDashboard = async (): Promise<React.JSX.Element> => {
  const payload = await getPayload({ config })
  const notifications = await payload.find({
    collection: 'notifications',
    depth: 0,
    limit: 5,
    sort: '-createdAt',
  })

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

      {notifications.docs.length > 0 ? (
        <section className={`${baseClass}__notifications`}>
          <div className={`${baseClass}__notifications-head`}>
            <h4>Latest notifications</h4>
            <a href="/admin/collections/notifications">All notifications</a>
          </div>
          <table className={`${baseClass}__notifications-table`}>
            <thead>
              <tr>
                <th>Notification</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {notifications.docs.map((notification) => {
                const sourceURL = coerceUrl(notification.sourceURL)

                return (
                  <tr key={notification.id}>
                    <td>
                      <div className={`${baseClass}__title-wrap`}>
                        <a
                          className={`${baseClass}__title-link`}
                          href={`/admin/collections/notifications/${notification.id}`}
                          title={notification.title}
                        >
                          <span className={`${baseClass}__title-desktop`}>
                            {truncateText(notification.title, 110)}
                          </span>
                          <span className={`${baseClass}__title-mobile`}>
                            {truncateText(notification.title, 55)}
                          </span>
                        </a>
                        <small className={`${baseClass}__subtext`}>
                          Status: {notification.overallStatus} | Matched: {formatDate(notification.matchedAt)} |
                          Created: {formatDate(notification.createdAt)}
                        </small>
                      </div>
                    </td>
                    <td>
                      {sourceURL ? (
                        <a className={`${baseClass}__meta`} href={sourceURL} rel="noreferrer" target="_blank">
                          <span>Source link</span>
                          <ExternalLink aria-hidden size={14} />
                        </a>
                      ) : (
                        <span className={`${baseClass}__meta`} aria-disabled>
                          <span>Source link</span>
                          <ExternalLink aria-hidden size={14} />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  )
}

export default BeforeDashboard
