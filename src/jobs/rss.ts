import { XMLParser } from 'fast-xml-parser'

export type FeedItem = {
  id: string
  title?: string
  link?: string
  commentsLink?: string
  externalLink?: string
  thumbnailUrl?: string
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
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = normalizeLink(entry)
      if (candidate) return candidate
    }
    return undefined
  }
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const href = (value as { href?: unknown }).href
    if (typeof href === 'string') return href
  }
  return undefined
}

const normalizeMediaUrl = (value: unknown): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const url = (value as { url?: unknown }).url
    if (typeof url === 'string') return url
    const href = (value as { href?: unknown }).href
    if (typeof href === 'string') return href
  }
  return undefined
}

const decodeHtmlEntitiesOnce = (value: string): string => {
  return value.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16)
      return Number.isNaN(code) ? match : String.fromCodePoint(code)
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10)
      return Number.isNaN(code) ? match : String.fromCodePoint(code)
    }
    const namedMap: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: ' ',
    }
    return namedMap[entity] ?? match
  })
}

const decodeHtmlEntities = (value: string, passes = 2): string => {
  let result = value
  for (let i = 0; i < passes; i += 1) {
    result = decodeHtmlEntitiesOnce(result)
  }
  return result
}

const extractAnchorLinks = (html: string): Array<{ href: string; text: string }> => {
  const anchors: Array<{ href: string; text: string }> = []
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match = regex.exec(html)
  while (match) {
    const href = match[1]
    const rawText = stripHtml(match[2])
    anchors.push({ href, text: rawText.trim() })
    match = regex.exec(html)
  }
  return anchors
}

const extractRedditMeta = (args: {
  entryId?: string
  entryLink?: string
  content?: string
}): { isReddit: boolean; commentsLink?: string; externalLink?: string } => {
  const { entryId, entryLink, content } = args
  const isReddit = Boolean(
    (entryId && /^t[13]_/i.test(entryId)) ||
      (entryLink && entryLink.includes('reddit.com')) ||
      (content && /SC_OFF|reddit\.com\/r\//i.test(content)),
  )

  if (!isReddit || !content) {
    return { isReddit, commentsLink: entryLink }
  }

  const anchors = extractAnchorLinks(content)
  const commentsAnchor = anchors.find(
    (anchor) => /\bcomments?\b/i.test(anchor.text) || /reddit\.com\/r\/.+\/comments\//i.test(anchor.href),
  )
  const linkAnchor = anchors.find((anchor) => /\blink\b/i.test(anchor.text))

  return {
    isReddit,
    commentsLink: commentsAnchor?.href || entryLink,
    externalLink: linkAnchor?.href,
  }
}

const selectAtomLink = (value: unknown): string | undefined => {
  const candidates = toArray(value).map((entry) => {
    if (typeof entry === 'string') return { href: entry }
    if (entry && typeof entry === 'object') return entry as Record<string, unknown>
    return null
  }).filter(Boolean) as Record<string, unknown>[]

  const preferred = candidates.find((candidate) => {
    const rel = typeof candidate.rel === 'string' ? candidate.rel : undefined
    const type = typeof candidate.type === 'string' ? candidate.type : undefined
    return rel === 'alternate' && (!type || type.includes('html'))
  })

  return normalizeLink(preferred || candidates[0])
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
      const entryId = normalizeText(entry.id)
      const atomLink = selectAtomLink(entry.link)
      const contentRaw = normalizeText(entry.content) ?? normalizeText(entry.summary)
      const decodedContent = contentRaw ? decodeHtmlEntities(contentRaw, 2) : undefined
      const redditMeta = extractRedditMeta({
        entryId,
        entryLink: atomLink,
        content: decodedContent,
      })
      const content = decodedContent
        ? redditMeta.isReddit
          ? stripHtml(decodedContent)
          : decodedContent
        : undefined
      const updated = normalizeText(entry.updated) ?? normalizeText(entry.published)
      const author = normalizeText(entry.author?.name) ?? normalizeText(entry.author)
      const thumbnailUrl = normalizeMediaUrl(entry['media:thumbnail'])
      const link = redditMeta.commentsLink ?? atomLink ?? entryId

      return {
        id: entryId || link || title || `atom-${Math.random()}`,
        title,
        link,
        commentsLink: redditMeta.commentsLink,
        externalLink: redditMeta.externalLink,
        thumbnailUrl,
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
