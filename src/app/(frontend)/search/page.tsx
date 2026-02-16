import type { Metadata } from 'next/types'

import { Card, type CardPostData } from '@/components/Card'
import type { Post } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const searchResults = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    // depth: 1 populates meta.image so Card thumbnails display; full doc gives doc.relationTo for paths
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {}),
  })

  type RelationTo = 'posts'
  const validRelationTo: RelationTo[] = ['posts']

  function getRelationTo(searchDoc: (typeof searchResults.docs)[0]): RelationTo {
    const doc = searchDoc.doc
    let r: string | undefined
    if (doc && typeof doc === 'object' && doc !== null && 'relationTo' in doc) {
      r = (doc as { relationTo?: string }).relationTo
    } else {
      r = (searchDoc as unknown as { 'doc.relationTo'?: string })['doc.relationTo']
    }
    if (r && validRelationTo.includes(r as RelationTo)) return r as RelationTo
    return 'posts'
  }

  // Map search results to match CardPostData type and include relationTo for proper routing
  const posts: Array<CardPostData & { relationTo: RelationTo }> = searchResults.docs.map((doc) => {
    const relationTo = getRelationTo(doc)
    
    // Transform search result to match CardPostData structure
    // Note: Search collection categories are in a different format, but Card component handles this
    return {
      slug: doc.slug || '',
      title: doc.title || undefined,
      meta: doc.meta || undefined,
      categories: doc.categories as unknown as Post['categories'],
      relationTo,
    } as CardPostData & { relationTo: RelationTo }
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {searchResults.totalDocs > 0 ? (
        <div className="container">
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
            {posts.map((result, index) => {
              if (typeof result === 'object' && result !== null) {
                const relationTo = result.relationTo || 'posts'
                // Extract the card data without relationTo for the Card component
                const { relationTo: _, ...cardData } = result
                return (
                  <div className="col-span-4" key={index}>
                    <Card
                      className="h-full"
                      doc={cardData as CardPostData}
                      relationTo={relationTo}
                      showCategories={relationTo === 'posts'}
                    />
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `rssnotify Search`,
  }
}
