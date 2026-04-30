import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

// Map collection slugs to their index page paths (for collections that use drag reorder)
const collectionPaths: Record<string, string> = {}

export const revalidateIndexOnOrderChange =
  (collectionSlug: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req: { payload, context } }) => {
    if (!context.disableRevalidate && !context.skipIndexRevalidate) {
      // Only revalidate if the order field changed
      const orderChanged = previousDoc && doc.order !== previousDoc.order

      if (orderChanged) {
        const indexPath = collectionPaths[collectionSlug]
        if (indexPath) {
          try {
            // Revalidate the main index page (same pattern as index pages hook)
            revalidatePath(indexPath)

            // Revalidate sitemap tag (used by collection hooks)
            const sitemapTag = `${collectionSlug}-sitemap`
            revalidateTag(sitemapTag, 'max')

            payload.logger.info(
              `Revalidated cache for ${collectionSlug} index page: path=${indexPath}, tag=${sitemapTag}`
            )

            // Mark that we've revalidated to prevent duplicate revalidations in the same batch
            context.skipIndexRevalidate = true
          } catch (err: unknown) {
            payload.logger.error(`Error revalidating ${collectionSlug} index page: ${err}`)
          }
        }
      }
    }

    return doc
  }
