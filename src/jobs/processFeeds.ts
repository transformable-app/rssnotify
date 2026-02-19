import type { PayloadRequest, TaskConfig, Where } from 'payload'
import type { FeedAutomation, Notification, RssFeed } from '@/payload-types'

import { fetchFeedItems } from './rss'

const MAX_ITEMS_PER_FEED = 25
const MAX_MODEL_RAW_CHARS = 2000
const MAX_MODEL_COMMENT_CHARS = 800
const MAX_MODEL_COMMENT_COUNT = 20

const normalizeContent = (value?: string | null): string => {
  return (value || '').replace(/\s+/g, ' ').trim()
}

const runModelCheck = async (args: {
  content: string
  model?: string | null
  prompt?: string | null
}): Promise<boolean> => {
  const { content, model, prompt } = args

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return false

  const basePrompt =
    prompt?.trim() ||
    'Answer with YES if the content should trigger an alert. Otherwise answer NO.'
  const systemPrompt = `${basePrompt}\n\nAlways answer with exactly YES or NO. Announcement posts, moderator posts, and welcome posts are always NO.`

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const endpoint = baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const automationModel = typeof model === 'string' ? model.trim() : ''
  const modelName = automationModel || process.env.MODEL_NAME || 'gpt-5-nano'
  const debugFeeds = process.env.DEBUG_FEEDS === 'true'
  const debugPreviewChars = 1000

  if (debugFeeds) {
    console.log(
      `[process-feeds debug] OpenAI request: endpoint=${endpoint} model=${modelName} contentChars=${content.length}`,
    )
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
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
        `[process-feeds debug] OpenAI response: status=${response.status} ok=${response.ok} body=${preview}`,
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
        `[process-feeds debug] OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
    return false
  }
}

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

const expandItemsForAutomation = async (item: FeedItemWithFlags, rules: Record<string, unknown> | null) => {
  const followPostRss = Boolean(rules?.followPostRss)
  const processComments = Boolean(rules?.processComments)

  if (!followPostRss || !processComments || !item.link) return [item]

  const cleanedLink = item.link.replace(/\/+$/, '')
  const rssUrl = cleanedLink.endsWith('.rss') ? cleanedLink : `${cleanedLink}.rss`
  try {
    const commentItems = await fetchFeedItems(rssUrl)
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

const hasNotification = async (args: {
  req: PayloadRequest
  automationId: string
  sourceURL?: string
  title?: string
}): Promise<boolean> => {
  const { req, automationId, sourceURL, title } = args

  const where: Where | null = sourceURL
    ? {
        and: [
          { automation: { equals: automationId } },
          { sourceURL: { equals: sourceURL } },
        ],
      }
    : title
      ? {
          and: [
            { automation: { equals: automationId } },
            { title: { equals: title } },
          ],
        }
      : null

  if (!where) return false

  const existing = await req.payload.find({
    collection: 'notifications',
    where,
    limit: 1,
    depth: 0,
    req,
  })

  return existing.totalDocs > 0
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
      cron: '0 * * * * *',
      queue: 'feeds',
    },
  ],
  handler: async ({ req }) => {
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

    const summary = {
      feedsProcessed: 0,
      itemsFetched: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    }
    const parentNotified = new Map<string, boolean>()

    const [feedsResult, automationsResult] = await Promise.all([
      req.payload.find({
        collection: 'rss-feeds',
        where: { enabled: { equals: true } },
        limit: 0,
        depth: 0,
        req,
      }),
      req.payload.find({
        collection: 'feed-automations',
        where: { enabled: { equals: true } },
        limit: 0,
        depth: 0,
        req,
      }),
    ])

    const feeds = feedsResult.docs as RssFeed[]
    const automations = automationsResult.docs as FeedAutomation[]

    if (debug) {
      req.payload.logger.info(
        `process-feeds debug: feeds=${feeds.length} automations=${automations.length}`,
      )
    }

    for (const feed of feeds) {
      const feedAutomations = automations.filter((automation) => shouldProcessAutomation(automation, feed))
      if (!feedAutomations.length) continue

      let items = [] as Awaited<ReturnType<typeof fetchFeedItems>>

      try {
        items = await fetchFeedItems(feed.url)
      } catch (error) {
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
              : await expandItemsForAutomation(item as FeedItemWithFlags, rules)

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
            commentModelDecision = await runModelCheck({
              content: batchContent,
              model: typeof rules?.model === 'string' ? rules.model : undefined,
              prompt: typeof rules?.modelPrompt === 'string' ? rules.modelPrompt : undefined,
            })

            logDebug(
              debugKey,
              `process-feeds debug: batch model decision for "${parentItemForComments.title || 'untitled'}" => ${commentModelDecision}`,
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
                const parentAlreadyNotified = await hasNotification({
                  req,
                  automationId: automation.id,
                  sourceURL: parentKey,
                  title: targetItem.__parentTitle || undefined,
                })

                if (parentAlreadyNotified) {
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

            const alreadyNotified = await hasNotification({
              req,
              automationId: automation.id,
              sourceURL: sourceURL || undefined,
              title: targetItem.title || undefined,
            })

            logDebug(
              debugKey,
              `process-feeds debug: alreadyNotified for "${targetItem.title || 'untitled'}" => ${alreadyNotified}`,
            )

            if (alreadyNotified && (targetItem as FeedItemWithFlags).__isParent && parentKey) {
              parentNotified.set(parentKey, true)
            }

            if (alreadyNotified) continue

            const modelOk = notifyEveryPost
              ? true
              : commentModelDecision ?? (await runModelCheck({
                  content: modelContent,
                  model: typeof rules?.model === 'string' ? rules.model : undefined,
                  prompt: typeof rules?.modelPrompt === 'string' ? rules.modelPrompt : undefined,
                }))

            if (!notifyEveryPost && commentModelDecision === null) {
              logDebug(
                debugKey,
                `process-feeds debug: model decision for "${targetItem.title || 'untitled'}" => ${modelOk}`,
              )
            }

            if (!modelOk) continue

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

            await req.payload.create({
              collection: 'notifications',
              data: {
                ...notificationPayload,
                title: notificationPayload.title ?? 'Feed match',
              } as unknown as Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
              draft: false,
              req,
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
