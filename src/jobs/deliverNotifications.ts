import type { TaskConfig } from 'payload'
import type { Notification } from '@/payload-types'

import { sendEmail, sendNtfy } from './delivery'

const MAX_NOTIFICATIONS_PER_RUN = 25
const DEFAULT_SMTP_REQUEST_DELAY_MS = 500
const DEFAULT_DELIVER_NOTIFICATIONS_CRON = '0 * * * * *'

const deliverNotificationsCron =
  process.env.DELIVER_NOTIFICATIONS_CRON?.trim() || DEFAULT_DELIVER_NOTIFICATIONS_CRON

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const getSmtpRequestDelayMs = (): number => {
  const raw = process.env.SMTP_REQUEST_DELAY_MS
  if (!raw) return DEFAULT_SMTP_REQUEST_DELAY_MS

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_SMTP_REQUEST_DELAY_MS

  return Math.floor(parsed)
}

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
      cron: deliverNotificationsCron,
      queue: 'notifications',
    },
  ],
  handler: async ({ req }) => {
    const smtpRequestDelayMs = getSmtpRequestDelayMs()
    let lastEmailRequestAt = 0

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
        if (smtpRequestDelayMs > 0 && lastEmailRequestAt > 0) {
          const elapsed = Date.now() - lastEmailRequestAt
          if (elapsed < smtpRequestDelayMs) {
            await sleep(smtpRequestDelayMs - elapsed)
          }
        }

        const emailResult = await sendEmail({
          payload: req.payload,
          settings: emailSettings || {},
          subject: notification.title,
          text: notification.message || notification.title,
          sourceURL: notification.sourceURL,
        })
        lastEmailRequestAt = Date.now()

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
