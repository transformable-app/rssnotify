import type { PayloadRequest, Where } from 'payload'
import type { DigestRun, Notification, ResultFeed } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'

type FeedFormat = 'atom' | 'rss'
type RequestedFormat = FeedFormat | 'configured'

type FeedEntry = {
  id: string
  title: string
  link: string
  published: string
  updated: string
  content?: string
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const escapeCdata = (value: string): string => value.replace(/\]\]>/g, ']]]]><![CDATA[>')

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

const getRequestToken = (req: PayloadRequest): string | null => {
  const url = new URL(req.url || '/', getServerSideURL())
  const queryToken = url.searchParams.get('token')?.trim()
  if (queryToken) return queryToken

  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

const assertFeedAccess = (feed: ResultFeed, req: PayloadRequest): Response | null => {
  if (!feed.enabled) return new Response('Not found', { status: 404 })
  if (feed.visibility === 'public') return null

  const token = getRequestToken(req)
  if (!token || token !== feed.token) {
    return new Response('Forbidden', { status: 403 })
  }

  return null
}

const getLimit = (feed: ResultFeed): number => {
  if (typeof feed.limit !== 'number' || feed.limit < 1) return 50
  return Math.min(feed.limit, 200)
}

const getFormat = (feed: ResultFeed, requestedFormat: RequestedFormat): FeedFormat => {
  if (requestedFormat === 'atom' || requestedFormat === 'rss') return requestedFormat
  return feed.format === 'rss' ? 'rss' : 'atom'
}

const getBaseURL = (): string => getServerSideURL().replace(/\/$/, '')

const getFeedSelfURL = (feed: ResultFeed, format: FeedFormat): string => {
  const extension = format === 'rss' ? 'rss' : 'atom'
  const token = feed.visibility === 'private' ? `?token=${encodeURIComponent(feed.token)}` : ''
  return `${getBaseURL()}/api/result-feeds/${feed.id}/feed.${extension}${token}`
}

const getAdminURL = (collection: string, id: string): string => {
  return `${getBaseURL()}/admin/collections/${collection}/${id}`
}

const getNotificationWhere = (feed: ResultFeed): Where => {
  const and: Where[] = []
  const statuses = Array.isArray(feed.statuses) && feed.statuses.length > 0 ? feed.statuses : ['sent']
  and.push({ overallStatus: { in: statuses } } as Where)

  const automationIds = getRelationIds(feed.automations)
  if (automationIds.length > 0) {
    and.push({ automation: { in: automationIds } } as Where)
  }

  const feedIds = getRelationIds(feed.feeds)
  if (feedIds.length > 0) {
    and.push({ feed: { in: feedIds } } as Where)
  }

  return and.length === 1 ? and[0] : ({ and } as Where)
}

const getDigestRunWhere = (feed: ResultFeed): Where => {
  const and: Where[] = []
  const statuses = Array.isArray(feed.statuses) && feed.statuses.length > 0 ? feed.statuses : ['sent']
  and.push({ status: { in: statuses } } as Where)

  const digestIds = getRelationIds(feed.digests)
  if (digestIds.length > 0) {
    and.push({ digest: { in: digestIds } } as Where)
  }

  return and.length === 1 ? and[0] : ({ and } as Where)
}

const notificationToEntry = (notification: Notification, feed: ResultFeed): FeedEntry => {
  const feedName = getRelationName(notification.feed)
  const automationName = getRelationName(notification.automation)
  const contentParts = [
    notification.message,
    feedName ? `Feed: ${feedName}` : null,
    automationName ? `Automation: ${automationName}` : null,
    notification.overallStatus ? `Status: ${notification.overallStatus}` : null,
  ].filter(Boolean)

  return {
    id: `urn:rssnotify:notification:${notification.id}`,
    title: notification.title || 'Notification',
    link: notification.sourceURL || getAdminURL('notifications', notification.id),
    published: notification.matchedAt || notification.createdAt,
    updated: notification.updatedAt || notification.matchedAt || notification.createdAt,
    content: feed.includeContent ? contentParts.join('\n') : undefined,
  }
}

const getDigestSummary = (digestRun: DigestRun): string | undefined => {
  const aiOutput = digestRun.aiOutput
  if (aiOutput && typeof aiOutput === 'object' && !Array.isArray(aiOutput)) {
    const summary = (aiOutput as { summary?: unknown }).summary
    if (typeof summary === 'string' && summary.trim()) return summary.trim()
  }

  return digestRun.text || undefined
}

const digestRunToEntry = (digestRun: DigestRun, feed: ResultFeed): FeedEntry => {
  const digestName = getRelationName(digestRun.digest)
  const title =
    digestRun.subject ||
    [digestName || 'Digest', digestRun.sentAt || digestRun.createdAt].filter(Boolean).join(' - ')

  return {
    id: `urn:rssnotify:digest-run:${digestRun.id}`,
    title,
    link: getAdminURL('digest-runs', digestRun.id),
    published: digestRun.sentAt || digestRun.createdAt,
    updated: digestRun.updatedAt || digestRun.sentAt || digestRun.createdAt,
    content: feed.includeContent ? getDigestSummary(digestRun) : undefined,
  }
}

const loadEntries = async (req: PayloadRequest, feed: ResultFeed): Promise<FeedEntry[]> => {
  if (feed.resultType === 'digests') {
    const result = await req.payload.find({
      collection: 'digest-runs',
      where: getDigestRunWhere(feed),
      sort: '-sentAt',
      limit: getLimit(feed),
      depth: 1,
      overrideAccess: true,
      req,
    })

    return (result.docs as DigestRun[]).map((digestRun) => digestRunToEntry(digestRun, feed))
  }

  const result = await req.payload.find({
    collection: 'notifications',
    where: getNotificationWhere(feed),
    sort: '-matchedAt',
    limit: getLimit(feed),
    depth: 1,
    overrideAccess: true,
    req,
  })

  return (result.docs as Notification[]).map((notification) => notificationToEntry(notification, feed))
}

const renderAtom = (args: {
  feed: ResultFeed
  entries: FeedEntry[]
  selfURL: string
}): string => {
  const { feed, entries, selfURL } = args
  const updated = entries[0]?.updated || feed.updatedAt || new Date().toISOString()

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>urn:rssnotify:result-feed:${escapeXml(feed.id)}</id>
  <title>${escapeXml(feed.name)}</title>
  <updated>${escapeXml(updated)}</updated>
  <link rel="self" href="${escapeXml(selfURL)}" />
${entries
  .map(
    (entry) => `  <entry>
    <id>${escapeXml(entry.id)}</id>
    <title>${escapeXml(entry.title)}</title>
    <link href="${escapeXml(entry.link)}" />
    <published>${escapeXml(entry.published)}</published>
    <updated>${escapeXml(entry.updated)}</updated>${
      entry.content ? `\n    <content type="html"><![CDATA[${escapeCdata(entry.content)}]]></content>` : ''
    }
  </entry>`,
  )
  .join('\n')}
</feed>
`
}

const renderRss = (args: {
  feed: ResultFeed
  entries: FeedEntry[]
  selfURL: string
}): string => {
  const { feed, entries, selfURL } = args

  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.name)}</title>
    <link>${escapeXml(selfURL)}</link>
    <description>${escapeXml(`rssnotify ${feed.resultType} result feed`)}</description>
    <atom:link href="${escapeXml(selfURL)}" rel="self" type="application/rss+xml" />
${entries
  .map(
    (entry) => `    <item>
      <guid isPermaLink="false">${escapeXml(entry.id)}</guid>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.link)}</link>
      <pubDate>${escapeXml(new Date(entry.published).toUTCString())}</pubDate>${
        entry.content ? `\n      <description><![CDATA[${escapeCdata(entry.content)}]]></description>` : ''
      }
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`
}

export const renderResultFeed = async (args: {
  req: PayloadRequest
  id: string
  requestedFormat: RequestedFormat
}): Promise<Response> => {
  const { req, id, requestedFormat } = args

  let feed: ResultFeed | null = null
  try {
    feed = (await req.payload.findByID({
      collection: 'result-feeds',
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })) as ResultFeed
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const accessError = assertFeedAccess(feed, req)
  if (accessError) return accessError

  const format = getFormat(feed, requestedFormat)
  const selfURL = getFeedSelfURL(feed, format)
  const entries = await loadEntries(req, feed)
  const body = format === 'rss' ? renderRss({ feed, entries, selfURL }) : renderAtom({ feed, entries, selfURL })

  await req.payload.update({
    collection: 'result-feeds',
    id: feed.id,
    data: {
      lastAccessedAt: new Date().toISOString(),
    },
    overrideAccess: true,
    req,
  })

  return new Response(body, {
    headers: {
      'cache-control': feed.visibility === 'public' ? 'public, max-age=60' : 'private, max-age=60',
      'content-type': format === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/atom+xml; charset=utf-8',
    },
    status: 200,
  })
}
