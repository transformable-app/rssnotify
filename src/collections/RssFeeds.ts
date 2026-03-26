import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { authenticated } from '../access/authenticated'

export const RssFeeds: CollectionConfig<'rss-feeds'> = {
  slug: 'rss-feeds',
  labels: {
    singular: 'RSS Feed',
    plural: 'RSS Feeds',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'type', 'url', 'enabled', 'updatedAt'],
    useAsTitle: 'name',
    components: {
      beforeList: ['@/components/Admin/RssFeedsImportExportActions'],
    },
  },
  endpoints: [
    {
      path: '/export',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          throw new APIError('Unauthorized', 401)
        }

        const result = await req.payload.find({
          collection: 'rss-feeds',
          depth: 0,
          limit: 1000,
          overrideAccess: false,
          req,
          sort: 'name',
        })

        const feeds = result.docs.map((feed) => ({
          name: feed.name,
          type: feed.type,
          url: feed.url,
          enabled: feed.enabled,
          notes: feed.notes ?? '',
        }))

        return new Response(
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              feeds,
              source: 'rssnotify',
              version: 1,
            },
            null,
            2,
          ),
          {
            headers: {
              'content-disposition': `attachment; filename="rss-feeds-${new Date().toISOString().slice(0, 10)}.json"`,
              'content-type': 'application/json; charset=utf-8',
            },
            status: 200,
          },
        )
      },
    },
    {
      path: '/import',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          throw new APIError('Unauthorized', 401)
        }

        const body = (await req.json?.()) as { feeds?: unknown } | undefined
        const maybeFeeds = Array.isArray(body)
          ? body
          : Array.isArray(body?.feeds)
            ? body.feeds
            : null

        if (!maybeFeeds) {
          throw new APIError('Invalid import payload. Expected a JSON array or an object with a feeds array.', 400)
        }

        let created = 0
        let skipped = 0

        for (const entry of maybeFeeds) {
          if (!entry || typeof entry !== 'object') {
            throw new APIError('Each imported feed must be an object.', 400)
          }

          const rawFeed = entry as Record<string, unknown>
          const name = typeof rawFeed.name === 'string' ? rawFeed.name.trim() : ''
          const type = rawFeed.type
          const url = typeof rawFeed.url === 'string' ? rawFeed.url.trim() : ''
          const enabled = typeof rawFeed.enabled === 'boolean' ? rawFeed.enabled : true
          const notes =
            typeof rawFeed.notes === 'string' && rawFeed.notes.trim().length > 0 ? rawFeed.notes : undefined

          if (!name || !url) {
            throw new APIError('Each imported feed must include non-empty name and url values.', 400)
          }

          if (type !== 'rss' && type !== 'reddit' && type !== 'wordpress') {
            throw new APIError(`Feed "${name}" has an invalid type.`, 400)
          }

          const existing = await req.payload.find({
            collection: 'rss-feeds',
            depth: 0,
            limit: 1,
            overrideAccess: false,
            req,
            where: {
              url: {
                equals: url,
              },
            },
          })

          if (existing.docs[0]) {
            skipped += 1
            continue
          }

          await req.payload.create({
            collection: 'rss-feeds',
            data: {
              enabled,
              name,
              notes,
              type,
              url,
            },
            overrideAccess: false,
            req,
          })
          created += 1
        }

        return Response.json({ created, imported: maybeFeeds.length, ok: true, skipped })
      },
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'rss',
      options: [
        { label: 'Standard RSS', value: 'rss' },
        { label: 'Reddit', value: 'reddit' },
        { label: 'WordPress', value: 'wordpress' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
