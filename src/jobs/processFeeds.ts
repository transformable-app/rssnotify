import type { PayloadRequest, TaskConfig, Where } from 'payload'
import type { AutomationHistory, FeedAutomation, Notification, RssFeed } from '@/payload-types'
import { createHash } from 'crypto'
import {
  DEFAULT_MODEL_BASE_PROMPT,
  DEFAULT_MODEL_NAME,
  MODEL_RESPONSE_CONSTRAINTS,
} from '@/constants/modelDefaults'

import { fetchFeedItems } from './rss'

const MAX_ITEMS_PER_FEED = 25
const MAX_MODEL_RAW_CHARS = 2000
const MAX_MODEL_COMMENT_CHARS = 800
const MAX_MODEL_COMMENT_COUNT = 20
const DEFAULT_PROCESS_FEEDS_CRON = '0 */15 * * * *'
const DEFAULT_PROCESS_FEEDS_MIN_DELAY_SECONDS = 12 * 60
const DEFAULT_PROCESS_FEEDS_MAX_DELAY_SECONDS = 16 * 60 + 59
const DEFAULT_MODEL_TIMEOUT_MS = 15000
const IGNORE_RETRY_DELAYS_MS = [
  24 * 60 * 60 * 1000,
  48 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
] as const

const processFeedsCron = process.env.PROCESS_FEEDS_CRON?.trim() || DEFAULT_PROCESS_FEEDS_CRON
let nextProcessFeedsEligibleAt = 0

const parseDelaySeconds = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return fallback
  return parsed
}

const randomDelayMs = (minSeconds: number, maxSeconds: number): number => {
  const min = Math.max(0, Math.floor(minSeconds))
  const max = Math.max(min, Math.floor(maxSeconds))
  return (min + Math.floor(Math.random() * (max - min + 1))) * 1000
}

const normalizeContent = (value?: string | null): string => {
  return (value || '').replace(/\s+/g, ' ').trim()
}

const runModelCheck = async (args: {
  content: string
  model?: string | null
  prompt?: string | null
  defaultModel?: string | null
  defaultSystemPrompt?: string | null
}): Promise<boolean> => {
  const { content, model, prompt, defaultModel, defaultSystemPrompt } = args

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return false

  const automationPrompt = prompt?.trim()
  const configuredSystemPrompt = defaultSystemPrompt?.trim() || MODEL_RESPONSE_CONSTRAINTS
  const evaluationPrompt = automationPrompt || DEFAULT_MODEL_BASE_PROMPT
  const systemPrompt = `${configuredSystemPrompt}\n\n${evaluationPrompt}`

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const endpoint = baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const automationModel = typeof model === 'string' ? model.trim() : ''
  const configuredModel = typeof defaultModel === 'string' ? defaultModel.trim() : ''
  const modelName = automationModel || configuredModel || process.env.MODEL_NAME || DEFAULT_MODEL_NAME
  const debugFeeds = process.env.DEBUG_FEEDS === 'true'
  const debugPreviewChars = 1000
  const timeoutMs = parseDelaySeconds(process.env.OPENAI_TIMEOUT_MS, DEFAULT_MODEL_TIMEOUT_MS)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()

  if (debugFeeds) {
    console.log(
      `[process-feeds debug] OpenAI request: endpoint=${endpoint} model=${modelName} contentChars=${content.length} timeoutMs=${timeoutMs}`,
    )
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content,
          },
        ],
      }),
    })

    const rawResponse = await response.text()

    if (debugFeeds) {
      const preview =
        rawResponse.length > debugPreviewChars
          ? `${rawResponse.slice(0, debugPreviewChars)}...`
          : rawResponse
      console.log(
        `[process-feeds debug] OpenAI response: status=${response.status} ok=${response.ok} elapsedMs=${Date.now() - startedAt} body=${preview}`,
      )
    }

    if (!response.ok) {
      return false
    }

    let payload: { choices?: { message?: { content?: string } }[] } | null = null
    try {
      payload = JSON.parse(rawResponse) as { choices?: { message?: { content?: string } }[] }
    } catch {
      if (debugFeeds) {
        console.log('[process-feeds debug] OpenAI response was not valid JSON')
      }
      return false
    }

    const rawAnswer = payload.choices?.[0]?.message?.content || ''
    if (debugFeeds) {
      console.log(`[process-feeds debug] model response (${modelName}): ${rawAnswer}`)
    }
    const answer = rawAnswer.toLowerCase()
    return answer.includes('yes') || answer.includes('true')
  } catch (error) {
    if (debugFeeds) {
      console.log(
        `[process-feeds debug] OpenAI request failed after ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
    return false
  } finally {
    clearTimeout(timeout)
  }
}

type ProcessingSettings = {
  modelSettings?: {
    defaultModel?: string | null
    systemPrompt?: string | null
  } | null
  firecrawl?: {
    host?: string | null
    token?: string | null
  } | null
} | null

const serializeRawData = (raw: unknown, limit = MAX_MODEL_RAW_CHARS): string | null => {
  if (!raw) return null
  try {
    const serialized = JSON.stringify(raw)
    if (!serialized) return null
    return serialized.length > limit ? serialized.slice(0, limit) : serialized
  } catch {
    return null
  }
}

const buildCommentBatchModelContent = (args: {
  parentItem: FeedItemWithFlags
  commentItems: FeedItemWithFlags[]
}): string => {
  const { parentItem, commentItems } = args
  const parentTitle = parentItem.title ? `Parent post title: ${parentItem.title}` : null
  const parentContent = parentItem.content
    ? `Parent post content: ${normalizeContent(parentItem.content).slice(0, 2000)}`
    : null
  const parentRaw = serializeRawData(parentItem.raw)
  const parentRawSection = parentRaw ? `Parent post raw:\n${parentRaw}` : null

  const commentSections = commentItems.slice(0, MAX_MODEL_COMMENT_COUNT).map((comment, index) => {
    const author = comment.author ? ` by ${comment.author}` : ''
    const body = normalizeContent(comment.content).slice(0, MAX_MODEL_COMMENT_CHARS)
    return `Comment ${index + 1}${author}: ${body}`
  })

  return [parentTitle, parentContent, parentRawSection, 'Comments:', ...commentSections]
    .filter(Boolean)
    .join('\n\n')
}

const buildHistoryItemKey = (args: {
  automationId: string
  sourceURL?: string
  title?: string
}): string | null => {
  const { automationId, sourceURL, title } = args
  const value = sourceURL?.trim() || title?.trim()
  if (!value) return null

  return createHash('sha256').update(`${automationId}::${value}`).digest('hex')
}

const shouldProcessAutomation = (automation: FeedAutomation, feed: RssFeed): boolean => {
  if (!automation.enabled) return false
  if (automation.type !== feed.type) return false
  if (!automation.feeds || automation.feeds.length === 0) return true

  return automation.feeds.some((entry) => {
    if (typeof entry === 'string') return entry === feed.id
    return entry?.id === feed.id
  })
}

const mergeRules = (
  standardRules: FeedAutomation['standardRules'] | undefined | null,
  typeRules: FeedAutomation['redditRules'] | FeedAutomation['wordpressRules'] | undefined | null,
) => {
  if (!standardRules && !typeRules) return null
  return {
    ...(standardRules || {}),
    ...(typeRules || {}),
  }
}

const getAutomationRules = (automation: FeedAutomation) => {
  if (automation.type === 'reddit') {
    return mergeRules(automation.standardRules, automation.redditRules)
  }
  if (automation.type === 'wordpress') {
    return mergeRules(automation.standardRules, automation.wordpressRules)
  }
  return mergeRules(automation.standardRules, null)
}

type FeedItemWithFlags = Awaited<ReturnType<typeof fetchFeedItems>>[number] & {
  __isComment?: boolean
  __isParent?: boolean
  __parentKey?: string
  __parentTitle?: string
  __parentContent?: string
}

type HistoryCheck = NonNullable<AutomationHistory['checks']>[number]

const expandItemsForAutomation = async (
  item: FeedItemWithFlags,
  rules: Record<string, unknown> | null,
  processingSettings?: ProcessingSettings,
) => {
  const followPostRss = Boolean(rules?.followPostRss)
  const processComments = Boolean(rules?.processComments)

  if (!followPostRss || !processComments || !item.link) return [item]

  const cleanedLink = item.link.replace(/\/+$/, '')
  const rssUrl = cleanedLink.endsWith('.rss') ? cleanedLink : `${cleanedLink}.rss`
  try {
    const commentItems = await fetchFeedItems(rssUrl, processingSettings?.firecrawl ?? undefined)
    const parentKey = item.commentsLink || item.link || item.id
    const parentTitle = item.title
    const parentContent = item.content
    return [
      { ...item, __isParent: true, __parentKey: parentKey, __parentTitle: parentTitle, __parentContent: parentContent },
      ...commentItems.map((comment) => ({
        ...comment,
        __isComment: true,
        __parentKey: parentKey,
        __parentTitle: parentTitle,
        __parentContent: parentContent,
      })),
    ]
  } catch {
    return [item]
  }
}

const getHistoryEntry = async (args: {
  req: PayloadRequest
  automationId: string
  sourceURL?: string
  title?: string
}): Promise<AutomationHistory | null> => {
  const { req, automationId, sourceURL, title } = args

  const itemKey = buildHistoryItemKey({ automationId, sourceURL, title })
  if (!itemKey) return null

  const existing = await req.payload.find({
    collection: 'automation-history',
    where: { itemKey: { equals: itemKey } } as Where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  return (existing.docs[0] as AutomationHistory | undefined) || null
}

const isLikelyItemKeyConflict = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return message.includes('itemkey') || message.includes('duplicate key') || message.includes('unique')
}

const getRetryDate = (baseDate: Date, retryNumber: number): Date | null => {
  const delay = IGNORE_RETRY_DELAYS_MS[retryNumber]
  if (!delay) return null

  return new Date(baseDate.getTime() + delay)
}

const getHistoryChecks = (history?: AutomationHistory | null): HistoryCheck[] => {
  const existingChecks = Array.isArray(history?.checks) ? [...history.checks] : []
  if (existingChecks.length > 0) {
    return existingChecks as HistoryCheck[]
  }

  if (!history?.processedAt || !history?.status) {
    return []
  }

  return [
    {
      checkedAt: history.processedAt,
      status: history.status,
      reason: history.reason,
      attemptNumber: history.attemptCount || 1,
      retryNumber: history.retryCount || 0,
      nextRetryAt: history.nextRetryAt,
      notification: history.notification,
    } as HistoryCheck,
  ]
}

const getStoredAttemptCount = (history?: AutomationHistory | null): number => {
  if (!history) return 0
  if (typeof history.attemptCount === 'number' && history.attemptCount > 0) {
    return history.attemptCount
  }

  return getHistoryChecks(history).length
}

const getStoredRetryCount = (history?: AutomationHistory | null): number => {
  if (!history) return 0
  if (typeof history.retryCount === 'number' && history.retryCount >= 0) {
    return history.retryCount
  }

  const checks = getHistoryChecks(history)
  const lastCheck = checks[checks.length - 1]
  return typeof lastCheck?.retryNumber === 'number' ? lastCheck.retryNumber : 0
}

const getEffectiveNextRetryAt = (history?: AutomationHistory | null): string | null => {
  if (!history || history.status !== 'ignored' || history.retryExhausted) return null
  if (history.nextRetryAt) return history.nextRetryAt
  if (!history.processedAt) return null

  const fallback = getRetryDate(new Date(history.processedAt), getStoredRetryCount(history))
  return fallback?.toISOString() || null
}

const shouldSkipHistory = (history: AutomationHistory | null, now: Date): boolean => {
  if (!history) return false
  if (history.status === 'notified') return true
  if (history.retryExhausted) return true
  const nextRetryAt = getEffectiveNextRetryAt(history)
  if (!nextRetryAt) return false

  return new Date(nextRetryAt).getTime() > now.getTime()
}

const upsertHistory = async (args: {
  req: PayloadRequest
  history?: AutomationHistory | null
  automation: FeedAutomation
  feed: RssFeed
  title?: string
  sourceURL?: string
  matchedAt?: string
  processedAt?: string
  status: AutomationHistory['status']
  reason: string
  data?: AutomationHistory['data']
  notificationId?: string
}): Promise<AutomationHistory | null> => {
  const {
    req,
    history,
    automation,
    feed,
    title,
    sourceURL,
    matchedAt,
    processedAt,
    status,
    reason,
    data,
    notificationId,
  } = args
  const itemKey = buildHistoryItemKey({
    automationId: automation.id,
    sourceURL,
    title,
  })

  if (!itemKey) return null

  const checkedAt = processedAt || new Date().toISOString()
  const checkedAtDate = new Date(checkedAt)
  const previousAttemptCount = getStoredAttemptCount(history)
  const previousRetryCount = getStoredRetryCount(history)
  const currentRetryNumber = history ? previousRetryCount + 1 : 0
  const attemptCount = previousAttemptCount + 1
  const nextRetryDate = status === 'ignored' ? getRetryDate(checkedAtDate, currentRetryNumber) : null
  const nextRetryAt = nextRetryDate?.toISOString()
  const retryExhausted = status === 'ignored' ? nextRetryDate === null : false
  const checks = [
    ...getHistoryChecks(history),
    {
      checkedAt,
      status,
      reason,
      attemptNumber: attemptCount,
      retryNumber: currentRetryNumber,
      nextRetryAt,
      notification: notificationId,
    } as HistoryCheck,
  ]

  const payloadData = {
    itemKey,
    status,
    reason,
    automation: automation.id,
    feed: feed.id,
    sourceURL,
    title,
    matchedAt,
    processedAt: checkedAt,
    attemptCount,
    retryCount: currentRetryNumber,
    nextRetryAt,
    retryExhausted,
    notification: notificationId,
    checks,
    data,
  } as unknown as Omit<AutomationHistory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

  if (history?.id) {
    return await req.payload.update({
      collection: 'automation-history',
      id: history.id,
      data: payloadData,
      draft: false,
      overrideAccess: true,
      req,
    }) as AutomationHistory
  }

  try {
    return await req.payload.create({
      collection: 'automation-history',
      data: payloadData,
      draft: false,
      overrideAccess: true,
      req,
    }) as AutomationHistory
  } catch (error) {
    // Scheduled jobs can overlap and race on the unique itemKey. If another task
    // created the history row after our initial lookup, re-read it and update it.
    if (isLikelyItemKeyConflict(error)) {
      const conflictingHistory = await getHistoryEntry({
        req,
        automationId: automation.id,
        sourceURL,
        title,
      })

      if (conflictingHistory?.id) {
        return await upsertHistory({
          ...args,
          history: conflictingHistory,
        })
      }
    }

    throw error
  }
}

const buildNotificationPayload = (args: {
  automation: FeedAutomation
  feed: RssFeed
  title?: string
  message?: string
  sourceURL?: string
  matchedAt?: string
  data?: Notification['data']
}): Partial<Notification> => {
  const { automation, feed, title, message, sourceURL, matchedAt, data } = args

  return {
    title: title || 'Feed match',
    message,
    sourceURL,
    automation: automation.id,
    feed: feed.id,
    matchedAt: matchedAt || new Date().toISOString(),
    data,
  }
}

export const processFeedsTask: TaskConfig = {
  slug: 'process-feeds',
  label: 'Process RSS feeds',
  schedule: [
    {
      cron: processFeedsCron,
      queue: 'feeds',
    },
  ],
  handler: async ({ req }) => {
    const now = Date.now()
    if (now < nextProcessFeedsEligibleAt) {
      const remainingSeconds = Math.ceil((nextProcessFeedsEligibleAt - now) / 1000)
      return {
        output: {
          skipped: true,
          reason: 'throttled',
          remainingSeconds,
          nextEligibleAt: new Date(nextProcessFeedsEligibleAt).toISOString(),
        },
      }
    }

    const minDelaySeconds = parseDelaySeconds(
      process.env.PROCESS_FEEDS_MIN_DELAY_SECONDS,
      DEFAULT_PROCESS_FEEDS_MIN_DELAY_SECONDS,
    )
    const maxDelaySeconds = parseDelaySeconds(
      process.env.PROCESS_FEEDS_MAX_DELAY_SECONDS,
      DEFAULT_PROCESS_FEEDS_MAX_DELAY_SECONDS,
    )

    nextProcessFeedsEligibleAt = Date.now() + randomDelayMs(minDelaySeconds, maxDelaySeconds)

    const debug = process.env.DEBUG_FEEDS === 'true'
    const debugLimit = Number.parseInt(process.env.DEBUG_FEEDS_LIMIT || '5', 10)
    const debugCounts = new Map<string, number>()

    const logDebug = (key: string, message: string) => {
      if (!debug) return
      const count = debugCounts.get(key) ?? 0
      if (count >= debugLimit) return
      debugCounts.set(key, count + 1)
      req.payload.logger.info(message)
    }

    const logTiming = (message: string) => {
      if (!debug) return
      req.payload.logger.info(message)
    }

    const summary = {
      feedsProcessed: 0,
      itemsFetched: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    }
    const parentNotified = new Map<string, boolean>()

    const [feedsResult, automationsResult, settingsResult] = await Promise.all([
      req.payload.find({
        collection: 'rss-feeds',
        where: { enabled: { equals: true } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
        req,
      }),
      req.payload.find({
        collection: 'feed-automations',
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

    const feeds = feedsResult.docs as RssFeed[]
    const automations = automationsResult.docs as FeedAutomation[]
    const processingSettings = settingsResult as ProcessingSettings
    const settingsModel = processingSettings?.modelSettings?.defaultModel
    const settingsSystemPrompt = processingSettings?.modelSettings?.systemPrompt

    if (debug) {
      req.payload.logger.info(
        `process-feeds debug: feeds=${feeds.length} automations=${automations.length}`,
      )
    }

    for (const feed of feeds) {
      const feedAutomations = automations.filter((automation) => shouldProcessAutomation(automation, feed))
      if (!feedAutomations.length) continue

      let items = [] as Awaited<ReturnType<typeof fetchFeedItems>>
      const fetchStartedAt = Date.now()

      try {
        logTiming(`process-feeds debug: fetching feed "${feed.name}" (${feed.url})`)
        items = await fetchFeedItems(feed.url, processingSettings?.firecrawl ?? undefined)
        logTiming(
          `process-feeds debug: fetched feed "${feed.name}" items=${items.length} elapsedMs=${Date.now() - fetchStartedAt}`,
        )
      } catch (error) {
        logTiming(
          `process-feeds debug: feed fetch failed for "${feed.name}" elapsedMs=${Date.now() - fetchStartedAt} error=${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        summary.errors.push(`Feed ${feed.url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        continue
      }

      summary.feedsProcessed += 1
      summary.itemsFetched += items.length

      const limitedItems = items.slice(0, MAX_ITEMS_PER_FEED)

      for (const item of limitedItems) {
        for (const automation of feedAutomations) {
          const debugKey = `${feed.id}:${automation.id}`
          const rules = getAutomationRules(automation) as Record<string, unknown> | null

          const notifyEveryPost = Boolean(rules?.notifyEveryPost)
          const itemsToProcess =
            automation.type === 'rss'
              ? [item as FeedItemWithFlags]
              : await (async () => {
                const expandStartedAt = Date.now()
                logDebug(
                  debugKey,
                  `process-feeds debug: expanding item "${item.title || 'untitled'}" for automation "${automation.name}"`,
                )
                const expandedItems = await expandItemsForAutomation(
                  item as FeedItemWithFlags,
                  rules,
                  processingSettings,
                )
                logDebug(
                  debugKey,
                  `process-feeds debug: expanded item "${item.title || 'untitled'}" count=${expandedItems.length} elapsedMs=${Date.now() - expandStartedAt}`,
                )
                return expandedItems
              })()

          const commentItems = itemsToProcess.filter((entry) => entry.__isComment)
          const parentItemForComments =
            itemsToProcess.find((entry) => (entry as FeedItemWithFlags).__isParent) ||
            (item as FeedItemWithFlags)
          const useBatchCommentModel = automation.type === 'reddit' && commentItems.length > 0
          let commentModelDecision: boolean | null = null

          if (useBatchCommentModel && !notifyEveryPost) {
            const batchContent = buildCommentBatchModelContent({
              parentItem: parentItemForComments,
              commentItems,
            })
            const modelStartedAt = Date.now()
            logDebug(
              debugKey,
              `process-feeds debug: running batch model check for "${parentItemForComments.title || 'untitled'}"`,
            )
            commentModelDecision = await runModelCheck({
              content: batchContent,
              model: typeof rules?.model === 'string' ? rules.model : undefined,
              prompt: typeof rules?.modelPrompt === 'string' ? rules.modelPrompt : undefined,
              defaultModel: settingsModel,
              defaultSystemPrompt: settingsSystemPrompt,
            })

            logDebug(
              debugKey,
              `process-feeds debug: batch model decision for "${parentItemForComments.title || 'untitled'}" => ${commentModelDecision} elapsedMs=${Date.now() - modelStartedAt}`,
            )
          }

          for (const targetItem of itemsToProcess) {
            const isRedditComment = automation.type === 'reddit' && (targetItem as FeedItemWithFlags).__isComment
            const content = isRedditComment
              ? [targetItem.content].filter(Boolean).join('\n\n')
              : [targetItem.title, targetItem.content].filter(Boolean).join('\n\n')
            const modelContent = isRedditComment
              ? [
                  targetItem.__parentTitle ? `Parent post title: ${targetItem.__parentTitle}` : null,
                  targetItem.__parentContent
                    ? `Parent post content: ${normalizeContent(targetItem.__parentContent).slice(0, 2000)}`
                    : null,
                  `Comment: ${content}`,
                ]
                  .filter(Boolean)
                  .join('\n\n')
              : content

            const parentKey = targetItem.__parentKey
            if (isRedditComment && parentKey) {
              if (!parentNotified.has(parentKey)) {
                const parentHistoryStartedAt = Date.now()
                const parentHistory = await getHistoryEntry({
                  req,
                  automationId: automation.id,
                  sourceURL: parentKey,
                  title: targetItem.__parentTitle || undefined,
                })
                logDebug(
                  debugKey,
                  `process-feeds debug: parent history lookup for "${targetItem.__parentTitle || 'untitled'}" elapsedMs=${Date.now() - parentHistoryStartedAt}`,
                )

                if (parentHistory?.status === 'notified') {
                  parentNotified.set(parentKey, true)
                }
              }

              if (parentNotified.get(parentKey)) {
                logDebug(
                  debugKey,
                  `process-feeds debug: skipping comment because parent already notified (parentKey=${parentKey})`,
                )
                continue
              }
            }
            const sourceURL = automation.type === 'reddit'
              ? targetItem.commentsLink || targetItem.link
              : targetItem.link

            const historyStartedAt = Date.now()
            const existingHistory = await getHistoryEntry({
              req,
              automationId: automation.id,
              sourceURL: sourceURL || undefined,
              title: targetItem.title || undefined,
            })
            logDebug(
              debugKey,
              `process-feeds debug: history lookup for "${targetItem.title || 'untitled'}" elapsedMs=${Date.now() - historyStartedAt}`,
            )

            const skipBecauseOfHistory = shouldSkipHistory(existingHistory, new Date())

            logDebug(
              debugKey,
              `process-feeds debug: history state for "${targetItem.title || 'untitled'}" => ${existingHistory?.status || 'new'} skip=${skipBecauseOfHistory}`,
            )

            if (existingHistory?.status === 'notified' && (targetItem as FeedItemWithFlags).__isParent && parentKey) {
              parentNotified.set(parentKey, true)
            }

            if (skipBecauseOfHistory) continue

            const modelOk = notifyEveryPost
              ? true
              : commentModelDecision ?? (await (async () => {
                const modelStartedAt = Date.now()
                logDebug(
                  debugKey,
                  `process-feeds debug: running model check for "${targetItem.title || 'untitled'}"`,
                )
                const result = await runModelCheck({
                  content: modelContent,
                  model: typeof rules?.model === 'string' ? rules.model : undefined,
                  prompt: typeof rules?.modelPrompt === 'string' ? rules.modelPrompt : undefined,
                  defaultModel: settingsModel,
                  defaultSystemPrompt: settingsSystemPrompt,
                })
                logDebug(
                  debugKey,
                  `process-feeds debug: finished model check for "${targetItem.title || 'untitled'}" elapsedMs=${Date.now() - modelStartedAt}`,
                )
                return result
              })())

            if (!notifyEveryPost && commentModelDecision === null) {
              logDebug(
                debugKey,
                `process-feeds debug: model decision for "${targetItem.title || 'untitled'}" => ${modelOk}`,
              )
            }

            if (!modelOk) {
              await upsertHistory({
                req,
                history: existingHistory,
                automation,
                feed,
                title: targetItem.title || feed.name,
                sourceURL,
                matchedAt: targetItem.publishedAt,
                processedAt: new Date().toISOString(),
                status: 'ignored',
                reason: notifyEveryPost ? 'notify-every-post-disabled' : 'model-no-match',
                data: {
                  item: targetItem,
                  feed: {
                    id: feed.id,
                    url: feed.url,
                    name: feed.name,
                  },
                  automation: {
                    id: automation.id,
                    name: automation.name,
                    type: automation.type,
                  },
                },
              })
              continue
            }

            const notificationPayload = buildNotificationPayload({
              automation,
              feed,
              title: targetItem.title || feed.name,
              message: targetItem.content ? normalizeContent(targetItem.content).slice(0, 1000) : undefined,
              sourceURL,
              matchedAt: targetItem.publishedAt,
              data: {
                item: targetItem,
                feed: {
                  id: feed.id,
                  url: feed.url,
                  name: feed.name,
                },
                automation: {
                  id: automation.id,
                  name: automation.name,
                  type: automation.type,
                },
              },
            })

            const notification = await req.payload.create({
              collection: 'notifications',
              data: {
                ...notificationPayload,
                title: notificationPayload.title ?? 'Feed match',
              } as unknown as Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
              draft: false,
              overrideAccess: true,
              req,
            })

            await upsertHistory({
              req,
              history: existingHistory,
              automation,
              feed,
              title: notificationPayload.title ?? 'Feed match',
              sourceURL,
              matchedAt: targetItem.publishedAt,
              processedAt: new Date().toISOString(),
              status: 'notified',
              reason: notifyEveryPost ? 'notify-every-post' : 'model-match',
              notificationId: notification.id,
              data: {
                item: targetItem,
                feed: {
                  id: feed.id,
                  url: feed.url,
                  name: feed.name,
                },
                automation: {
                  id: automation.id,
                  name: automation.name,
                  type: automation.type,
                },
              },
            })

            if ((targetItem as FeedItemWithFlags).__isParent && parentKey) {
              parentNotified.set(parentKey, true)
            }

            summary.notificationsCreated += 1
          }
        }
      }
    }

    return {
      output: summary,
    }
  },
}
