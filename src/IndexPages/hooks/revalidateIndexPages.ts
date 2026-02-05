import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateIndexPages: GlobalAfterChangeHook = async ({ doc, req: _req, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    try {
      // Revalidate the cache tag used by getCachedGlobal
      revalidateTag('global_index-pages')

      // Revalidate all index page paths
      const paths = ['/posts']
      paths.forEach((path) => {
        revalidatePath(path)
      })

      payload.logger.info(`Revalidated index pages global and paths: ${paths.join(', ')}`)
    } catch (err: unknown) {
      payload.logger.error(`Error revalidating index pages: ${err}`)
    }
  }

  return doc
}

