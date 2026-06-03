import { XMLParser } from 'fast-xml-parser'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { renderResultFeed } from '@/jobs/resultFeeds'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
})

type MockReq = PayloadRequest & {
  payload: PayloadRequest['payload'] & {
    findByID: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

const buildReq = (args: {
  feed: Record<string, unknown>
  docs?: Record<string, unknown>[]
  url?: string
  authorization?: string
}): MockReq => {
  const { feed, docs = [], url = 'http://localhost:3000/api/result-feeds/feed-1/feed.atom', authorization } = args
  const headers = new Headers()
  if (authorization) headers.set('authorization', authorization)

  return {
    url,
    headers,
    payload: {
      findByID: vi.fn().mockResolvedValue(feed),
      find: vi.fn().mockResolvedValue({ docs }),
      update: vi.fn().mockResolvedValue({}),
    },
  } as MockReq
}

describe('renderResultFeed', () => {
  it('rejects private feeds without the configured token', async () => {
    const req = buildReq({
      feed: {
        id: 'feed-1',
        name: 'Private results',
        enabled: true,
        visibility: 'private',
        token: 'secret-token',
        resultType: 'notifications',
        format: 'atom',
        limit: 50,
        includeContent: true,
        updatedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-06-01T12:00:00.000Z',
      },
    })

    const response = await renderResultFeed({
      req,
      id: 'feed-1',
      requestedFormat: 'atom',
    })

    expect(response.status).toBe(403)
    expect(req.payload.find).not.toHaveBeenCalled()
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('renders notification Atom entries linked to sourceURL', async () => {
    const req = buildReq({
      feed: {
        id: 'feed-1',
        name: 'Public notification results',
        enabled: true,
        visibility: 'public',
        token: 'unused-token',
        resultType: 'notifications',
        format: 'atom',
        limit: 50,
        includeContent: true,
        updatedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-06-01T12:00:00.000Z',
      },
      docs: [
        {
          id: 'notification-1',
          title: 'Important <release>',
          message: 'Version 1.2.3 is available',
          sourceURL: 'https://example.com/releases/1.2.3',
          overallStatus: 'sent',
          matchedAt: '2026-06-02T09:30:00.000Z',
          updatedAt: '2026-06-02T09:31:00.000Z',
          createdAt: '2026-06-02T09:30:00.000Z',
        },
      ],
    })

    const response = await renderResultFeed({
      req,
      id: 'feed-1',
      requestedFormat: 'atom',
    })
    const body = await response.text()
    const xml = parser.parse(body)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/atom+xml; charset=utf-8')
    expect(xml.feed.entry.link.href).toBe('https://example.com/releases/1.2.3')
    expect(xml.feed.entry.title).toBe('Important <release>')
    expect(req.payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notifications',
        where: { overallStatus: { in: ['sent'] } },
        overrideAccess: true,
      }),
    )
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'result-feeds',
        id: 'feed-1',
        req,
      }),
    )
  })
})
