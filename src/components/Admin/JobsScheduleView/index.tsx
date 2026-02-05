import type { AdminViewServerProps } from 'payload'

import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui/elements/Gutter'

import { tasks } from '@/jobs'
import './index.scss'

const JobsScheduleView: React.FC<AdminViewServerProps> = (props) => {
  const {
    i18n,
    initPageResult,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewActions,
    visibleEntities,
  } = props

  const resolvedVisibleEntities =
    initPageResult?.visibleEntities ?? visibleEntities ?? { collections: [], globals: [] }
  const resolvedPermissions = initPageResult?.permissions ?? permissions

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={resolvedPermissions}
      req={req}
      searchParams={searchParams}
      user={user}
      viewActions={viewActions}
      viewType="dashboard"
      visibleEntities={resolvedVisibleEntities}
    >
      <div className="payload__container jobs-schedule-view">
        <Gutter>
          <div className="payload__flex">
            <div className="payload__flex__content">
              <h1>Jobs & Schedule</h1>
              <p className="description">
                These are the background tasks configured in Payload and their schedules.
              </p>

              <div className="table" style={{ marginTop: '1.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Slug</th>
                      <th>Schedule</th>
                      <th>Frequency</th>
                      <th>Queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const schedule = task.schedule ?? []
                      const scheduleEntries =
                        schedule.length > 0 ? schedule : [{ cron: 'Not scheduled', queue: '—' }]

                      return scheduleEntries.map((entry, index) => (
                        <tr key={`${task.slug}-${entry.cron}-${index}`}>
                          <td>{task.label || task.slug}</td>
                          <td>{task.slug}</td>
                          <td>
                            <code>{entry.cron}</code>
                          </td>
                          <td>{describeCron(entry.cron)}</td>
                          <td>{entry.queue || 'default'}</td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Gutter>
      </div>
    </DefaultTemplate>
  )
}

export default JobsScheduleView

const describeCron = (cron: string): string => {
  const parts = cron.trim().split(/\s+/)
  if (parts.length === 6) {
    const [sec, min, hour, dom, mon, dow] = parts
    if (sec === '0' && min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return 'Every minute'
    }
    if (sec === '0' && min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return `Every ${min.slice(2)} minutes`
    }
    if (sec === '0' && min !== '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return `Every hour at :${min.padStart(2, '0')}`
    }
  }

  if (parts.length === 5) {
    const [min, hour, dom, mon, dow] = parts
    if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return 'Every minute'
    }
    if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return `Every ${min.slice(2)} minutes`
    }
    if (min !== '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return `Every hour at :${min.padStart(2, '0')}`
    }
  }

  return 'Custom schedule'
}
