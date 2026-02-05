import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ req, originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { slug, id, categories, title, meta, name, role, heroImage, photo } = originalDoc

  const docTitle = title || name || 'Untitled'

  let imageToUse = meta?.image
  if (heroImage && typeof heroImage === 'object') {
    imageToUse = heroImage
  } else if (heroImage && typeof heroImage === 'string') {
    imageToUse = heroImage
  }

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    title: docTitle,
    meta: {
      ...meta,
      title: meta?.title || docTitle,
      image: imageToUse?.id || imageToUse || meta?.image,
      description: meta?.description || (role ? `${role}` : undefined),
    },
    categories: [],
  }

  // Only process categories if they exist (posts have categories, others don't)
  if (categories && Array.isArray(categories) && categories.length > 0) {
    const populatedCategories: { id: string | number; title: string }[] = []
    for (const category of categories) {
      if (!category) {
        continue
      }

      if (typeof category === 'object') {
        populatedCategories.push(category)
        continue
      }

      const doc = await req.payload.findByID({
        collection: 'categories',
        id: category,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      })

      if (doc !== null) {
        populatedCategories.push(doc)
      } else {
        console.error(
          `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search.`,
        )
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: 'categories',
      categoryID: String(each.id),
      title: each.title,
    }))
  }

  return modifiedDoc
}
