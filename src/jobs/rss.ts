import { XMLParser } from 'fast-xml-parser'
import packageJson from '../../package.json'

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

export type FirecrawlSettings = {
  host?: string | null
  token?: string | null
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  processEntities: {
    enabled: true,
    maxTotalExpansions: 10000,
    maxExpandedLength: 1000000,
  },
})

const defaultUserAgent = `rssnotify/${packageJson.version}`

const configuredUserAgents = (process.env.RSS_FETCH_USER_AGENTS || '')
  .split(/[\n,]/)
  .map((value) => value.trim())
  .filter(Boolean)

const userAgents = configuredUserAgents.length > 0 ? configuredUserAgents : [defaultUserAgent]

const hashToIndex = (value: string, modulo: number): number => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % modulo
  }
  return hash
}

const userAgentForUrl = (url: string): string => {
  const index = hashToIndex(url, userAgents.length)
  return userAgents[index]
}

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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const readEnvSeconds = (key: string, fallback: number): number => {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const trimToUndefined = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const randomDelayMs = (minSeconds = 1, maxSeconds = 20): number => {
  const min = Math.max(0, Math.floor(minSeconds))
  const max = Math.max(min, Math.floor(maxSeconds))
  return (min + Math.floor(Math.random() * (max - min + 1))) * 1000
}

const isXmlContentType = (contentType: string | null): boolean => {
  if (!contentType) return false
  const normalized = contentType.toLowerCase()
  return (
    normalized.includes('application/rss+xml') ||
    normalized.includes('application/atom+xml') ||
    normalized.includes('application/xml') ||
    normalized.includes('text/xml') ||
    normalized.includes('+xml')
  )
}

const looksLikeHtmlDocument = (value: string): boolean => {
  const start = value.trimStart().slice(0, 500).toLowerCase()
  return (
    start.startsWith('<!doctype html') ||
    start.startsWith('<html') ||
    start.includes('<head') ||
    start.includes('<body')
  )
}

const looksLikeRedditBlockPage = (value: string): boolean => {
  const sample = value.slice(0, 4000).toLowerCase()
  return (
    sample.includes('reddit') &&
    (sample.includes('blocked') ||
      sample.includes('request blocked') ||
      sample.includes('whoa there') ||
      sample.includes('access denied') ||
      sample.includes('robot') ||
      sample.includes('captcha'))
  )
}

const extractXmlCandidate = (value: string): string | undefined => {
  const patterns = [
    /<\?xml[\s\S]*?<rss[\s\S]*?<\/rss>/i,
    /<\?xml[\s\S]*?<feed[\s\S]*?<\/feed>/i,
    /<\?xml[\s\S]*?<rdf:RDF[\s\S]*?<\/rdf:RDF>/i,
    /<rss[\s\S]*?<\/rss>/i,
    /<feed[\s\S]*?<\/feed>/i,
    /<rdf:RDF[\s\S]*?<\/rdf:RDF>/i,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[0]) {
      return match[0].trim()
    }
  }

  return undefined
}

const recoverXmlFromResponseBody = (body: string): string | undefined => {
  const directMatch = extractXmlCandidate(body)
  if (directMatch) return directMatch

  const decodedBody = decodeHtmlEntities(body, 3)
  const decodedMatch = extractXmlCandidate(decodedBody)
  if (decodedMatch) return decodedMatch

  return undefined
}

const extractPreContent = (html: string): string | undefined => {
  const match = html.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/i)
  if (!match?.[1]) return undefined
  return match[1].trim()
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

const fetchTextViaFirecrawl = async (args: {
  firecrawlHost: string
  firecrawlToken?: string
  timeoutMs: number
  url: string
  xml: boolean
}): Promise<string> => {
  const { firecrawlHost, firecrawlToken, timeoutMs, url, xml } = args
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const endpoint = `${firecrawlHost.replace(/\/$/, '')}/v2/scrape`
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (firecrawlToken) {
    headers.authorization = `Bearer ${firecrawlToken}`
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        url,
        formats: xml ? ['html', 'rawHtml'] : ['html'],
        onlyMainContent: false,
        timeout: timeoutMs,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} via Firecrawl: ${response.status} ${response.statusText}`)
    }

    const payload = (await response.json()) as {
      success?: boolean
      data?: {
        html?: string
        rawHtml?: string
        markdown?: string
        metadata?: {
          error?: string
          contentType?: string
        }
      }
    }

    if (payload.success === false) {
      throw new Error(payload.data?.metadata?.error || `Failed to fetch ${url} via Firecrawl`)
    }

    const body =
      trimToUndefined(payload.data?.rawHtml) ||
      trimToUndefined(payload.data?.html) ||
      trimToUndefined(payload.data?.markdown)

    if (!body) {
      throw new Error(`Firecrawl did not return content for ${url}`)
    }

    if (xml) {
      const preContent = extractPreContent(body)
      if (preContent) {
        const recoveredFromPre = recoverXmlFromResponseBody(preContent)
        if (recoveredFromPre) {
          return recoveredFromPre
        }
      }

      const metadataContentType = payload.data?.metadata?.contentType?.toLowerCase()
      if (metadataContentType?.includes('xml') || metadataContentType?.includes('atom')) {
        const recoveredXml = recoverXmlFromResponseBody(body)
        if (recoveredXml) {
          return recoveredXml
        }
      }
    }

    return body
  } finally {
    clearTimeout(timeout)
  }
}

export const fetchText = async (
  url: string,
  timeoutMs = 15000,
  firecrawl?: FirecrawlSettings,
): Promise<string> => {
  const minDelay = readEnvSeconds('RSS_FETCH_JITTER_MIN_SECONDS', 1)
  const maxDelay = readEnvSeconds('RSS_FETCH_JITTER_MAX_SECONDS', 10)
  await sleep(randomDelayMs(minDelay, maxDelay))

  const firecrawlHost = trimToUndefined(firecrawl?.host)
  if (firecrawlHost) {
    return fetchTextViaFirecrawl({
      firecrawlHost,
      firecrawlToken: trimToUndefined(firecrawl?.token),
      timeoutMs,
      url,
      xml: false,
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': userAgentForUrl(url),
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

export const fetchXmlText = async (
  url: string,
  timeoutMs = 15000,
  firecrawl?: FirecrawlSettings,
): Promise<string> => {
  const minDelay = readEnvSeconds('RSS_FETCH_JITTER_MIN_SECONDS', 1)
  const maxDelay = readEnvSeconds('RSS_FETCH_JITTER_MAX_SECONDS', 10)
  await sleep(randomDelayMs(minDelay, maxDelay))

  const firecrawlHost = trimToUndefined(firecrawl?.host)
  if (firecrawlHost) {
    const body = await fetchTextViaFirecrawl({
      firecrawlHost,
      firecrawlToken: trimToUndefined(firecrawl?.token),
      timeoutMs,
      url,
      xml: true,
    })

    const recoveredXml = recoverXmlFromResponseBody(body)
    if (recoveredXml) {
      return recoveredXml
    }

    if (looksLikeRedditBlockPage(body)) {
      throw new Error('Expected XML feed but received a Reddit block/challenge page')
    }

    if (looksLikeHtmlDocument(body)) {
      throw new Error('Expected XML feed but received HTML content')
    }

    return body
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': userAgentForUrl(url),
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    const body = await response.text()
    const recoveredXml = recoverXmlFromResponseBody(body)

    if (recoveredXml) {
      return recoveredXml
    }

    if (!isXmlContentType(contentType)) {
      if (looksLikeRedditBlockPage(body)) {
        throw new Error(`Expected XML feed but received a Reddit block/challenge page (${contentType || 'unknown content-type'})`)
      }

      if (looksLikeHtmlDocument(body)) {
        throw new Error(`Expected XML feed but received HTML (${contentType || 'unknown content-type'})`)
      }

      throw new Error(`Expected XML feed but received ${contentType || 'unknown content-type'}`)
    }

    if (looksLikeHtmlDocument(body)) {
      throw new Error('Expected XML feed but received HTML content')
    }

    return body
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
      const author =
        normalizeText((entry.author as { name?: string } | undefined)?.name) ??
        normalizeText(entry.author as string | undefined)
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

export const fetchFeedItems = async (url: string, firecrawl?: FirecrawlSettings): Promise<FeedItem[]> => {
  const xml = await fetchXmlText(url, 15000, firecrawl)
  return parseFeedItems(xml)
}

export const fetchLinkText = async (
  url: string,
  timeoutMs = 15000,
  firecrawl?: FirecrawlSettings,
): Promise<string | null> => {
  try {
    const html = await fetchText(url, timeoutMs, firecrawl)
    return stripHtml(html)
  } catch {
    return null
  }
}
