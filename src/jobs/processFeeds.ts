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

type GeneratedPost = {
  title: string
  summary?: string
  body: string
}

const renderTemplate = (template: string, values: Record<string, string | undefined>) => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => values[key] ?? '')
}

const extractJsonFromText = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return null
}

const buildLexicalContent = (body: string) => {
  const normalized = body.replace(/\r\n/g, '\n').trim()
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const direction = 'ltr' as const
  const format = '' as const

  const children =
    paragraphs.length > 0
      ? paragraphs.map((paragraph) => ({
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              version: 1,
            },
          ],
          direction,
          format,
          indent: 0,
          textFormat: 0,
          version: 1,
        }))
      : [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                version: 1,
              },
            ],
            direction,
            format,
            indent: 0,
            textFormat: 0,
            version: 1,
          },
        ]

  return {
    root: {
      type: 'root',
      children,
      direction,
      format,
      indent: 0,
      version: 1,
    },
  }
}

const runPostCreation = async (args: {
  content: string
  model?: string | null
  prompt?: string | null
}): Promise<GeneratedPost | null> => {
  const { content, model, prompt } = args

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const endpoint = baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const modelName = model || process.env.MODEL_NAME || 'gpt-4o-mini'

  const basePrompt =
    prompt?.trim() ||
    'You are a helpful writing assistant. Draft a blog post based on the provided source.'
  const systemPrompt = `${basePrompt}\n\nReturn valid JSON with keys "title", "summary", and "body". The "body" must be plain text with paragraphs separated by blank lines.`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.4,
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

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const raw = payload.choices?.[0]?.message?.content || ''
  const jsonText = extractJsonFromText(raw)
  if (!jsonText) return null

  try {
    const parsed = JSON.parse(jsonText) as { title?: string; summary?: string; body?: string }
    if (!parsed?.title || !parsed?.body) return null
    return {
      title: String(parsed.title).trim(),
      summary: parsed.summary ? String(parsed.summary).trim() : undefined,
      body: String(parsed.body).trim(),
    }
  } catch {
    return null
  }
}

const runImageGeneration = async (args: {
  prompt: string
  model?: string | null
  size?: string | null
}): Promise<Buffer | null> => {
  const { prompt, model, size } = args

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !prompt.trim()) return null

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const endpoint = baseURL.replace(/\/$/, '') + '/v1/images/generations'
  const modelName = model || process.env.IMAGE_MODEL_NAME || 'gpt-image-1'
  const imageSize = size || process.env.IMAGE_SIZE || '1024x1024'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      prompt,
      size: imageSize,
      response_format: 'b64_json',
    }),
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[]
  }

  const image = payload.data?.[0]
  if (image?.b64_json) {
    return Buffer.from(image.b64_json, 'base64')
  }

  if (image?.url) {
    const imageResponse = await fetch(image.url)
    if (!imageResponse.ok) return null
    const buffer = await imageResponse.arrayBuffer()
    return Buffer.from(buffer)
  }

  return null
}

const slugify = (value: string) => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned.slice(0, 80) || `post-${Date.now()}`
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

            let createdPostId: string | null = null
            let createdMediaId: string | null = null

            if (rules?.createPost) {
              const postPrompt =
                typeof rules.postPrompt === 'string' ? rules.postPrompt : undefined
              const renderedPostPrompt = postPrompt
                ? renderTemplate(postPrompt, {
                    title: targetItem.title || feed.name,
                    sourceURL,
                    feedName: feed.name,
                    matchedContent: content,
                  })
                : undefined

              const postResult = await runPostCreation({
                content,
                model: typeof rules.postModel === 'string' ? rules.postModel : undefined,
                prompt: renderedPostPrompt,
              })

              if (!postResult) {
                summary.errors.push(
                  `Automation ${automation.name}: post generation failed for ${sourceURL || targetItem.title || 'item'}`,
                )
              } else {
                const postTitle = postResult.title || targetItem.title || feed.name
                const postSummary = postResult.summary || postResult.body.slice(0, 180)

                if (rules?.generateImage) {
                  const imagePrompt =
                    typeof rules.imagePrompt === 'string'
                      ? rules.imagePrompt
                      : 'Create a clean editorial illustration for the blog post "{{title}}".'

                  const renderedImagePrompt = renderTemplate(imagePrompt, {
                    title: postTitle,
                    summary: postSummary,
                    sourceURL,
                    feedName: feed.name,
                    matchedContent: content,
                  })

                  const imagePromptWithContext = `${renderedImagePrompt}\n\nMatched content:\n${content}`

                  const imageBuffer = await runImageGeneration({
                    prompt: imagePromptWithContext,
                    model: typeof rules.imageModel === 'string' ? rules.imageModel : undefined,
                    size: typeof rules.imageSize === 'string' ? rules.imageSize : undefined,
                  })

                  if (!imageBuffer) {
                    summary.errors.push(
                      `Automation ${automation.name}: image generation failed for ${postTitle}`,
                    )
                  } else {
                    const filename = `${slugify(postTitle)}.png`
                    const mediaDoc = await req.payload.create({
                      collection: 'media',
                      data: {
                        alt: postTitle,
                      },
                      file: {
                        data: imageBuffer,
                        name: filename,
                        mimetype: 'image/png',
                        size: imageBuffer.length,
                      },
                      req,
                    })

                    createdMediaId = mediaDoc.id
                  }
                }

                const createdPost = await req.payload.create({
                  collection: 'posts',
                  data: {
                    title: postTitle,
                    heroImage: createdMediaId || undefined,
                    content: buildLexicalContent(postResult.body),
                    meta: {
                      title: postTitle,
                      description: postSummary,
                      image: createdMediaId || undefined,
                    },
                  },
                  draft: true,
                  req,
                })

                createdPostId = createdPost.id
              }
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
                post: createdPostId
                  ? {
                      id: createdPostId,
                      title: targetItem.title || feed.name,
                      heroImage: createdMediaId || undefined,
                    }
                  : undefined,
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
