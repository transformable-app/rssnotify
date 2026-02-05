import type { TaskConfig } from 'payload'
import type { FeedAutomation, Notification, RssFeed } from '@/payload-types'

import { fetchFeedItems, fetchLinkText } from './rss'

const MAX_ITEMS_PER_FEED = 25

const normalizeContent = (value?: string | null): string => {
  return (value || '').replace(/\s+/g, ' ').trim()
}

const matchesTextRule = (content: string, matchString?: string | null, matchMode?: string | null): boolean => {
  const target = normalizeContent(content)
  if (!matchString) return true

  if (matchMode === 'regex') {
    try {
      const regex = new RegExp(matchString, 'i')
      return regex.test(target)
    } catch {
      return false
    }
  }

  return target.toLowerCase().includes(matchString.toLowerCase())
}

const runModelCheck = async (args: {
  content: string
  model?: string | null
  prompt?: string | null
}): Promise<boolean> => {
  const { content, model, prompt } = args

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return true

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const endpoint = baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const modelName = model || process.env.MODEL_NAME || 'gpt-4o-mini'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: prompt || 'Answer with YES if the content should trigger an alert. Otherwise answer NO.',
        },
        {
          role: 'user',
          content,
        },
      ],
    }),
  })

  if (!response.ok) {
    return true
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const answer = payload.choices?.[0]?.message?.content?.toLowerCase() || ''
  return answer.includes('yes') || answer.includes('true')
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

const expandItemsForAutomation = async (item: { link?: string }, rules: Record<string, unknown> | null) => {
  const followPostRss = Boolean(rules?.followPostRss)
  const processComments = Boolean(rules?.processComments)

  if (!followPostRss || !processComments || !item.link) return [item]

  const cleanedLink = item.link.replace(/\/+$/, '')
  const rssUrl = cleanedLink.endsWith('.rss') ? cleanedLink : `${cleanedLink}.rss`
  try {
    return await fetchFeedItems(rssUrl)
  } catch {
    return [item]
  }
}

const hasNotification = async (args: {
  req: Parameters<NonNullable<TaskConfig['handler']>>[0]['req']
  automationId: string
  sourceURL?: string
  title?: string
}): Promise<boolean> => {
  const { req, automationId, sourceURL, title } = args

  const where = sourceURL
    ? {
        and: [{ automation: { equals: automationId } }, { sourceURL: { equals: sourceURL } }],
      }
    : title
      ? {
          and: [{ automation: { equals: automationId } }, { title: { equals: title } }],
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
      cron: '0 */5 * * * *',
      queue: 'feeds',
    },
  ],
  handler: async ({ req }) => {
    const summary = {
      feedsProcessed: 0,
      itemsFetched: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    }

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
          const rules = getAutomationRules(automation) as Record<string, unknown> | null

          const fetchLinkContent = Boolean(rules?.fetchLinkContent)
          const matchMode = typeof rules?.matchMode === 'string' ? rules.matchMode : undefined
          const matchString = typeof rules?.matchString === 'string' ? rules.matchString : undefined

          const itemsToProcess = automation.type === 'rss' ? [item] : await expandItemsForAutomation(item, rules)

          for (const targetItem of itemsToProcess) {
            let content = [targetItem.title, targetItem.content].filter(Boolean).join('\n\n')
            const linkForContent = automation.type === 'reddit'
              ? targetItem.externalLink || targetItem.link
              : targetItem.link

            if (fetchLinkContent && linkForContent) {
              const linkContent = await fetchLinkText(linkForContent)
              if (linkContent) {
                content = `${content}\n\n${linkContent}`
              }
            }

            const matchesRule = matchesTextRule(content, matchString, matchMode)

            if (!matchesRule) continue

            if (rules?.useModel) {
              const modelOk = await runModelCheck({
                content,
                model: typeof rules.model === 'string' ? rules.model : undefined,
                prompt: typeof rules.modelPrompt === 'string' ? rules.modelPrompt : undefined,
              })

              if (!modelOk) continue
            }

            const alreadyNotified = await hasNotification({
              req,
              automationId: automation.id,
              sourceURL: targetItem.link || undefined,
              title: targetItem.title || undefined,
            })

            if (alreadyNotified) continue

            const sourceURL = automation.type === 'reddit'
              ? targetItem.commentsLink || targetItem.link
              : targetItem.link

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
              data: notificationPayload,
              req,
            })

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
