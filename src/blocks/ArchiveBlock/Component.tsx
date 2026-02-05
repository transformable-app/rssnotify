import type { ArchiveBlock as ArchiveBlockProps, Post } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'

type CollectionDoc = Post
type CollectionSlug = 'posts'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    relationTo = 'posts',
    selectedDocs,
  } = props

  const limit = limitFromProps || 3

  let docs: CollectionDoc[] = []
  let collectionRelationTo: CollectionSlug = 'posts'

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const selectedCollection: CollectionSlug = 'posts'
    collectionRelationTo = selectedCollection

    // Only add categories filter if the collection supports categories
    // (currently only posts has categories)
    const whereClause =
      flattenedCategories && flattenedCategories.length > 0 && selectedCollection === 'posts'
        ? {
            categories: {
              in: flattenedCategories,
            },
          }
        : undefined

    const fetchedDocs = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      ...(whereClause ? { where: whereClause } : {}),
    })

    docs = fetchedDocs.docs as CollectionDoc[]
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedDocs = selectedDocs
        .map((doc) => {
          if (typeof doc.value === 'object') return doc.value
          return null
        })
        .filter((doc): doc is CollectionDoc => doc !== null)

      docs = filteredSelectedDocs

      // Extract relationTo from the first selected doc
      if (selectedDocs[0]?.relationTo) {
        collectionRelationTo = selectedDocs[0].relationTo as typeof collectionRelationTo
      }
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={docs as CardPostData[]} relationTo={collectionRelationTo} />
    </div>
  )
}
