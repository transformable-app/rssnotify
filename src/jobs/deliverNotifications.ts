import type { TaskConfig } from 'payload'
import type { Notification } from '@/payload-types'

import { sendEmail, sendNtfy } from './delivery'

const MAX_NOTIFICATIONS_PER_RUN = 25

const determineOverallStatus = (statuses: Array<'sent' | 'failed' | 'skipped' | 'pending'>): Notification['overallStatus'] => {
  if (statuses.includes('failed')) return 'failed'
  if (statuses.includes('sent')) return 'sent'
  if (statuses.every((status) => status === 'skipped')) return 'skipped'
  return 'pending'
}

export const deliverNotificationsTask: TaskConfig = {
  slug: 'deliver-notifications',
  label: 'Deliver notifications',
  schedule: [
    {
      cron: '0 * * * * *',
      queue: 'notifications',
    },
  ],
  handler: async ({ req }) => {
    const settings = await req.payload.findGlobal({
      slug: 'settings',
      req,
    })

    const emailSettings = settings?.notifications?.email
    const ntfySettings = settings?.notifications?.ntfy

    const pending = await req.payload.find({
      collection: 'notifications',
      where: { overallStatus: { equals: 'pending' } },
      limit: MAX_NOTIFICATIONS_PER_RUN,
      depth: 0,
      req,
    })

    let processed = 0

    for (const notification of pending.docs as Notification[]) {
      const updates: Partial<Notification> = {
        delivery: {
          email: { ...notification.delivery?.email },
          ntfy: { ...notification.delivery?.ntfy },
        },
      }

      const statuses: Array<'sent' | 'failed' | 'skipped' | 'pending'> = []

      if (updates.delivery?.email?.status === 'pending') {
        const emailResult = await sendEmail({
          payload: req.payload,
          settings: emailSettings || {},
          subject: notification.title,
          text: notification.message || notification.title,
          sourceURL: notification.sourceURL,
        })

        updates.delivery.email = {
          status: emailResult.status,
          sentAt: emailResult.status === 'sent' ? new Date().toISOString() : notification.delivery?.email?.sentAt,
          error: emailResult.error,
        }
      }

      if (updates.delivery?.ntfy?.status === 'pending') {
        const ntfyResult = await sendNtfy({
          settings: ntfySettings || {},
          title: notification.title,
          message: notification.message || notification.title,
          url: notification.sourceURL,
        })

        updates.delivery.ntfy = {
          status: ntfyResult.status,
          sentAt: ntfyResult.status === 'sent' ? new Date().toISOString() : notification.delivery?.ntfy?.sentAt,
          error: ntfyResult.error,
        }
      }

      statuses.push(updates.delivery?.email?.status || 'pending')
      statuses.push(updates.delivery?.ntfy?.status || 'pending')

      updates.overallStatus = determineOverallStatus(statuses)

      await req.payload.update({
        collection: 'notifications',
        id: notification.id,
        data: updates,
        req,
      })

      processed += 1
    }

    return {
      output: {
        processed,
      },
    }
  },
}
