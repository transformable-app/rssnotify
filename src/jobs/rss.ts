import { XMLParser } from 'fast-xml-parser'

export type FeedItem = {
  id: string
  title?: string
  link?: string
  content?: string
  publishedAt?: string
  author?: string
  raw?: unknown
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
})

const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && '#text' in value) {
    const text = (value as { '#text'?: unknown })['#text']
    if (typeof text === 'string') return text
  }
  return undefined
}

const normalizeLink = (value: unknown): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const href = (value as { href?: unknown }).href
    if (typeof href === 'string') return href
  }
  return undefined
}

export const stripHtml = (html: string): string => {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const fetchText = async (url: string, timeoutMs = 15000): Promise<string> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'rssnotify/1.0 (+https://payloadcms.com)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, text/html;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export const parseFeedItems = (xml: string): FeedItem[] => {
  const parsed = parser.parse(xml)

  if (parsed?.rss?.channel) {
    const items = toArray(parsed.rss.channel.item)
    return items.map((item: Record<string, unknown>): FeedItem => {
      const title = normalizeText(item.title)
      const link = normalizeLink(item.link)
      const guid = normalizeText(item.guid)
      const content = normalizeText(item['content:encoded']) ?? normalizeText(item.description)
      const pubDate = normalizeText(item.pubDate) ?? normalizeText(item['dc:date'])
      const author = normalizeText(item.author)

      return {
        id: guid || link || title || `rss-${Math.random()}`,
        title,
        link,
        content,
        publishedAt: pubDate,
        author,
        raw: item,
      }
    })
  }

  if (parsed?.feed?.entry) {
    const entries = toArray(parsed.feed.entry)
    return entries.map((entry: Record<string, unknown>): FeedItem => {
      const title = normalizeText(entry.title)
      const link = normalizeLink(entry.link) ?? normalizeText(entry.id)
      const content = normalizeText(entry.content) ?? normalizeText(entry.summary)
      const updated = normalizeText(entry.updated) ?? normalizeText(entry.published)
      const author = normalizeText(entry.author?.name) ?? normalizeText(entry.author)

      return {
        id: normalizeText(entry.id) || link || title || `atom-${Math.random()}`,
        title,
        link,
        content,
        publishedAt: updated,
        author,
        raw: entry,
      }
    })
  }

  return []
}

export const fetchFeedItems = async (url: string): Promise<FeedItem[]> => {
  const xml = await fetchText(url)
  return parseFeedItems(xml)
}

export const fetchLinkText = async (url: string, timeoutMs = 15000): Promise<string | null> => {
  try {
    const html = await fetchText(url, timeoutMs)
    return stripHtml(html)
  } catch {
    return null
  }
}
