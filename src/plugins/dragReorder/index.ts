import type { Config, CollectionSlug, Plugin, PayloadRequest } from 'payload'
import { revalidateIndexOnOrderChange } from './hooks/revalidateIndexOnOrderChange'

interface DragReorderPluginConfig {
  collections: string[]
  fieldName?: string
}

export const dragReorderPlugin =
  (options: DragReorderPluginConfig): Plugin =>
  (config: Config): Config => {
    const { collections, fieldName = 'order' } = options

    // Add custom endpoints and hooks for each collection
    config.collections = config.collections?.map((collection) => {
      if (collections.includes(collection.slug)) {
        const reorderEndpoint = {
          path: '/reorder',
          method: 'post' as const,
          handler: async (req: PayloadRequest) => {
            if (!req.json) {
              return Response.json({ error: 'Invalid request' }, { status: 400 })
            }
            const { ids } = await req.json()

            if (!req.user) {
              return Response.json({ error: 'Unauthorized' }, { status: 401 })
            }

            try {
              // Update each document with its new order
              // Don't disable revalidation - let the hook handle it
              const updates = ids.map((id: string, index: number) =>
                req.payload.update({
                  collection: collection.slug as CollectionSlug,
                  id,
                  data: {
                    [fieldName]: index + 1,
                  },
                  req,
                  overrideAccess: false,
                }),
              )

              await Promise.all(updates)

              return Response.json({ success: true })
            } catch (error) {
              req.payload.logger.error(`Failed to reorder ${collection.slug}: ${String(error)}`)
              return Response.json({ error: 'Failed to reorder' }, { status: 500 })
            }
          },
        }

        const existingEndpoints = collection.endpoints || []
        const existingHooks = collection.hooks || {}
        const existingAfterChange = existingHooks.afterChange || []

        return {
          ...collection,
          endpoints: [...existingEndpoints, reorderEndpoint],
          hooks: {
            ...existingHooks,
            afterChange: [
              ...existingAfterChange,
              revalidateIndexOnOrderChange(collection.slug),
            ],
          },
        }
      }
      return collection
    })

    return config
  }

