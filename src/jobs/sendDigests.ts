import type { PayloadRequest, TaskConfig, Where } from 'payload'
import type { Digest, Notification, Setting } from '@/payload-types'

import { DEFAULT_MODEL_NAME } from '@/constants/modelDefaults'
import {
  formatOpenAIEndpointAttempts,
  runOpenAIChatCompletion,
} from '@/utilities/openAIChatCompletions'
import { sendEmail, type EmailSettings } from './delivery'

const DEFAULT_SEND_DIGESTS_CRON = '0 * * * * *'
const DEFAULT_DIGEST_LOOKBACK_HOURS = 24
const DEFAULT_MAX_DIGEST_NOTIFICATIONS = 50
const DEFAULT_MODEL_TIMEOUT_MS = 30000
const DEFAULT_SMTP_REQUEST_DELAY_MS = 500

const sendDigestsCron = process.env.SEND_DIGESTS_CRON?.trim() || DEFAULT_SEND_DIGESTS_CRON

type DigestRunStatus = 'pending' | 'sent' | 'failed' | 'skipped'

type DigestAIOutput = {
  subject?: string
  summary?: string
  highPriority?: string[]
  mediumPriority?: string[]
  lowPriority?: string[]
  omittedIds?: string[]
}

type DigestNotification = Notification & {
  automation?: string | { id?: string; name?: string | null } | null
  feed?: string | { id?: string; name?: string | null } | null
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

const getSmtpRequestDelayMs = (): number => {
  return parsePositiveInt(process.env.SMTP_REQUEST_DELAY_MS, DEFAULT_SMTP_REQUEST_DELAY_MS)
}

const getRelationId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' ? id : null
  }
  return null
}

const getRelationName = (value: unknown): string | null => {
  if (!value || typeof value === 'string' || typeof value !== 'object') return null
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

const getRelationIds = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []
  return values.map(getRelationId).filter((id): id is string => Boolean(id))
}

const getFormatterParts = (date: Date, timezone: string): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })

  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
}

const getLocalDateKey = (date: Date, timezone: string): string => {
  const parts = getFormatterParts(date, timezone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

const isDigestDue = (digest: Digest, now: Date): boolean => {
  const time = digest.schedule?.time?.trim()
  const timezone = digest.schedule?.timezone || 'UTC'
  const match = time?.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!match) return false

  const [, hour, minute] = match
  const parts = getFormatterParts(now, timezone)
  if (parts.hour !== hour || parts.minute !== minute) return false

  if (!digest.lastRunAt) return true

  return getLocalDateKey(new Date(digest.lastRunAt), timezone) !== getLocalDateKey(now, timezone)
}

const getWindowStart = (digest: Digest, now: Date): Date => {
  if (digest.lastSuccessAt) return new Date(digest.lastSuccessAt)
  if (digest.lastRunAt) return new Date(digest.lastRunAt)

  const lookbackHours =
    typeof digest.lookbackHours === 'number' && digest.lookbackHours > 0
      ? digest.lookbackHours
      : DEFAULT_DIGEST_LOOKBACK_HOURS

  return new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)
}

const buildRunKey = (digest: Digest, windowEnd: Date): string => {
  const timezone = digest.schedule?.timezone || 'UTC'
  return `${digest.id}:${getLocalDateKey(windowEnd, timezone)}`
}

const findExistingRun = async (req: PayloadRequest, runKey: string): Promise<boolean> => {
  const result = await req.payload.find({
    collection: 'digest-runs',
    where: { runKey: { equals: runKey } } as Where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  return result.docs.length > 0
}

const buildNotificationWhere = (args: {
  digest: Digest
  windowStart: Date
  windowEnd: Date
}): Where => {
  const { digest, windowStart, windowEnd } = args
  const and: Where[] = [
    {
      matchedAt: {
        greater_than_equal: windowStart.toISOString(),
        less_than_equal: windowEnd.toISOString(),
      },
    } as Where,
  ]

  const automationIds = getRelationIds(digest.automations)
  if (automationIds.length > 0) {
    and.push({ automation: { in: automationIds } } as Where)
  }

  const feedIds = getRelationIds(digest.feeds)
  if (feedIds.length > 0) {
    and.push({ feed: { in: feedIds } } as Where)
  }

  return { and } as Where
}

const loadNotifications = async (args: {
  req: PayloadRequest
  digest: Digest
  windowStart: Date
  windowEnd: Date
}): Promise<DigestNotification[]> => {
  const { req, digest, windowStart, windowEnd } = args
  const maxNotifications =
    typeof digest.maxNotifications === 'number' && digest.maxNotifications > 0
      ? digest.maxNotifications
      : DEFAULT_MAX_DIGEST_NOTIFICATIONS

  const result = await req.payload.find({
    collection: 'notifications',
    where: buildNotificationWhere({ digest, windowStart, windowEnd }),
    sort: '-matchedAt',
    limit: maxNotifications,
    depth: 1,
    overrideAccess: true,
    req,
  })

  return result.docs as DigestNotification[]
}

const buildBasicSubject = (
  digest: Digest,
  notifications: DigestNotification[],
  now: Date,
): string => {
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: digest.schedule?.timezone || 'UTC',
  }).format(now)

  return `${digest.name} digest: ${notifications.length} notification${notifications.length === 1 ? '' : 's'} for ${date}`
}

const buildNotificationText = (notification: DigestNotification, index: number): string => {
  const automation = getRelationName(notification.automation)
  const feed = getRelationName(notification.feed)
  const metadata = [
    notification.matchedAt ? `Matched: ${notification.matchedAt}` : null,
    feed ? `Feed: ${feed}` : null,
    automation ? `Automation: ${automation}` : null,
  ].filter(Boolean)

  return [
    `${index + 1}. ${notification.title}`,
    notification.message,
    notification.sourceURL ? `Source: ${notification.sourceURL}` : null,
    metadata.length ? metadata.join(' | ') : null,
  ]
    .filter(Boolean)
    .join('\n')
}

const buildBasicText = (args: {
  digest: Digest
  notifications: DigestNotification[]
  windowStart: Date
  windowEnd: Date
  aiSummary?: string
}): string => {
  const { digest, notifications, windowStart, windowEnd, aiSummary } = args
  return [
    `${digest.name} digest`,
    `Window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`,
    aiSummary ? `Summary:\n${aiSummary}` : null,
    'Notifications:',
    ...notifications.map(buildNotificationText),
  ]
    .filter(Boolean)
    .join('\n\n')
}

const buildNotificationHtml = (notification: DigestNotification, index: number): string => {
  const automation = getRelationName(notification.automation)
  const feed = getRelationName(notification.feed)
  const metadata = [
    notification.matchedAt ? `Matched: ${notification.matchedAt}` : null,
    feed ? `Feed: ${feed}` : null,
    automation ? `Automation: ${automation}` : null,
  ].filter(Boolean)
  const title = escapeHtml(notification.title || 'Untitled notification')
  const link = notification.sourceURL
  const linkedTitle = link ? `<a href="${escapeHtml(link)}">${title}</a>` : title

  return [
    '<li>',
    `<h2>${index + 1}. ${linkedTitle}</h2>`,
    notification.message ? `<p>${escapeHtml(notification.message)}</p>` : '',
    link ? `<p><a href="${escapeHtml(link)}">View source</a></p>` : '',
    metadata.length ? `<p><small>${escapeHtml(metadata.join(' | '))}</small></p>` : '',
    '</li>',
  ].join('')
}

const buildBasicHtml = (args: {
  digest: Digest
  notifications: DigestNotification[]
  windowStart: Date
  windowEnd: Date
  aiSummary?: string
}): string => {
  const { digest, notifications, windowStart, windowEnd, aiSummary } = args
  return [
    `<h1>${escapeHtml(digest.name)} digest</h1>`,
    `<p><strong>Window:</strong> ${escapeHtml(windowStart.toISOString())} to ${escapeHtml(windowEnd.toISOString())}</p>`,
    aiSummary ? `<h2>Summary</h2><p>${escapeHtml(aiSummary)}</p>` : '',
    '<h2>Notifications</h2>',
    `<ol>${notifications.map(buildNotificationHtml).join('')}</ol>`,
  ].join('')
}

const buildAIContent = (notifications: DigestNotification[]): string => {
  return JSON.stringify(
    notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      sourceURL: notification.sourceURL,
      feed: getRelationName(notification.feed),
      automation: getRelationName(notification.automation),
      matchedAt: notification.matchedAt,
    })),
  )
}

const parseAIOutput = (value: string): DigestAIOutput | null => {
  const trimmed = value.trim()
  const json = trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed

  try {
    const parsed = JSON.parse(json) as DigestAIOutput
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const runDigestModel = async (args: {
  digest: Digest
  settings: Setting
  notifications: DigestNotification[]
}): Promise<{ output?: DigestAIOutput; error?: string }> => {
  const { digest, settings, notifications } = args
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: 'OPENAI_API_KEY is not configured.' }

  const defaultSystemPrompt = settings.modelSettings?.systemPrompt?.trim()
  const digestInstructions = digest.instructions?.trim()
  const priorityInstructions =
    digest.priorityInstructions?.trim() ||
    'Prioritize actionable, time-sensitive, security, release, outage, or high-signal items first. Group duplicates together. Keep source titles and sourceURL links intact.'
  const systemPrompt = [
    'You write concise email digests for RSS notifications.',
    'Return JSON only with keys: subject, summary, highPriority, mediumPriority, lowPriority, omittedIds.',
    'Priority arrays must contain notification ids only. Do not invent ids. All email item links must use the notification sourceURL.',
    defaultSystemPrompt,
    digestInstructions,
    priorityInstructions,
  ]
    .filter(Boolean)
    .join('\n\n')

  const configuredModel = settings.modelSettings?.defaultModel?.trim()
  const modelName = configuredModel || process.env.MODEL_NAME || DEFAULT_MODEL_NAME
  const timeoutMs = parsePositiveInt(process.env.OPENAI_TIMEOUT_MS, DEFAULT_MODEL_TIMEOUT_MS)

  const result = await runOpenAIChatCompletion({
    apiKey,
    model: modelName,
    timeoutMs,
    baseURL: process.env.OPENAI_BASE_URL,
    fallbackBaseURLs: process.env.OPENAI_FALLBACK_BASE_URLS,
    fallbackEndpoints: settings.modelSettings?.fallbackEndpoints || undefined,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildAIContent(notifications) },
    ],
  })

  if (!result.ok) {
    const attempts = formatOpenAIEndpointAttempts(result.attempts)
    return { error: attempts ? `${result.error}; attempts: ${attempts}` : result.error }
  }

  const output = parseAIOutput(result.content)
  if (!output) return { error: 'AI response content was not valid digest JSON.' }

  return { output }
}

const applyAIOrder = (
  notifications: DigestNotification[],
  output?: DigestAIOutput,
): DigestNotification[] => {
  if (!output) return notifications

  const byId = new Map(notifications.map((notification) => [notification.id, notification]))
  const orderedIds = [
    ...(output.highPriority || []),
    ...(output.mediumPriority || []),
    ...(output.lowPriority || []),
  ]
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((notification): notification is DigestNotification => Boolean(notification))
  const orderedSet = new Set(ordered.map((notification) => notification.id))
  const remaining = notifications.filter((notification) => !orderedSet.has(notification.id))

  return [...ordered, ...remaining]
}

const createDigestRun = async (args: {
  req: PayloadRequest
  digest: Digest
  runKey: string
  status: DigestRunStatus
  windowStart: Date
  windowEnd: Date
  notifications: DigestNotification[]
  subject?: string
  text?: string
  html?: string
  aiOutput?: DigestAIOutput | null
  error?: string
}) => {
  const {
    req,
    digest,
    runKey,
    status,
    windowStart,
    windowEnd,
    notifications,
    subject,
    text,
    html,
    aiOutput,
    error,
  } = args

  return await req.payload.create({
    collection: 'digest-runs',
    data: {
      digest: digest.id,
      runKey,
      status,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      sentAt: status === 'sent' ? new Date().toISOString() : undefined,
      notifications: notifications.map((notification) => notification.id),
      subject,
      text,
      html,
      aiOutput,
      error,
    },
    overrideAccess: true,
    req,
  })
}

const updateDigestRunMetadata = async (args: {
  req: PayloadRequest
  digest: Digest
  status: DigestRunStatus
  now: Date
}) => {
  const { req, digest, status, now } = args
  await req.payload.update({
    collection: 'digests',
    id: digest.id,
    data: {
      lastRunAt: now.toISOString(),
      ...(status === 'sent' ? { lastSuccessAt: now.toISOString() } : {}),
    },
    overrideAccess: true,
    req,
  })
}

const getEmailSettings = (settings: Setting, digest: Digest): EmailSettings => {
  const overrides = Array.isArray(digest.recipients) ? digest.recipients : []
  if (!overrides.length) return settings.notifications?.email || {}

  return {
    ...(settings.notifications?.email || {}),
    recipients: overrides,
  }
}

export const sendDigestsTask: TaskConfig = {
  slug: 'send-digests',
  label: 'Send digests',
  schedule: [
    {
      cron: sendDigestsCron,
      queue: 'notifications',
    },
  ],
  handler: async ({ req }) => {
    const now = new Date()
    const smtpRequestDelayMs = getSmtpRequestDelayMs()
    let lastEmailRequestAt = 0

    const [digestsResult, settings] = await Promise.all([
      req.payload.find({
        collection: 'digests',
        where: { enabled: { equals: true } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
        req,
      }),
      req.payload.findGlobal({
        slug: 'settings',
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])

    const dueDigests = (digestsResult.docs as Digest[]).filter((digest) => isDigestDue(digest, now))
    const output = {
      checked: digestsResult.docs.length,
      due: dueDigests.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const digest of dueDigests) {
      const windowStart = getWindowStart(digest, now)
      const windowEnd = now
      const runKey = buildRunKey(digest, windowEnd)

      if (await findExistingRun(req, runKey)) {
        output.skipped += 1
        continue
      }

      const notifications = await loadNotifications({ req, digest, windowStart, windowEnd })
      if (!notifications.length) {
        await createDigestRun({
          req,
          digest,
          runKey,
          status: 'skipped',
          windowStart,
          windowEnd,
          notifications,
          subject: `${digest.name} digest: no notifications`,
          text: 'No notifications matched this digest window.',
          html: '<p>No notifications matched this digest window.</p>',
          error: 'No notifications matched this digest window.',
        })
        await updateDigestRunMetadata({ req, digest, status: 'skipped', now })
        output.skipped += 1
        continue
      }

      const aiResult = digest.useAI
        ? await runDigestModel({ digest, settings: settings as Setting, notifications })
        : {}
      const orderedNotifications = applyAIOrder(notifications, aiResult.output)
      const subject =
        aiResult.output?.subject?.trim() || buildBasicSubject(digest, orderedNotifications, now)
      const text = buildBasicText({
        digest,
        notifications: orderedNotifications,
        windowStart,
        windowEnd,
        aiSummary: aiResult.output?.summary,
      })
      const html = buildBasicHtml({
        digest,
        notifications: orderedNotifications,
        windowStart,
        windowEnd,
        aiSummary: aiResult.output?.summary,
      })

      if (smtpRequestDelayMs > 0 && lastEmailRequestAt > 0) {
        const elapsed = Date.now() - lastEmailRequestAt
        if (elapsed < smtpRequestDelayMs) {
          await sleep(smtpRequestDelayMs - elapsed)
        }
      }

      const emailResult = await sendEmail({
        payload: req.payload,
        settings: getEmailSettings(settings as Setting, digest),
        subject,
        text,
        html,
      })
      lastEmailRequestAt = Date.now()

      const status = emailResult.status
      await createDigestRun({
        req,
        digest,
        runKey,
        status,
        windowStart,
        windowEnd,
        notifications: orderedNotifications,
        subject,
        text,
        html,
        aiOutput: aiResult.output || null,
        error: emailResult.error || aiResult.error,
      })
      await updateDigestRunMetadata({ req, digest, status, now })

      if (status === 'sent') output.sent += 1
      if (status === 'skipped') output.skipped += 1
      if (status === 'failed') {
        output.failed += 1
        output.errors.push(`${digest.name}: ${emailResult.error || 'Unknown email error.'}`)
      }
    }

    return { output }
  },
}
