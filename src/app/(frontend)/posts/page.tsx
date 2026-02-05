import type { Metadata } from 'next/types'
import type { IndexPage } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { Media } from '@/components/Media'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import RichText from '@/components/RichText'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { generateMeta } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })
  const getIndexPages = getCachedGlobal('index-pages', 2)
  const indexPages = (await getIndexPages()) as IndexPage | null

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  const pageTitle = indexPages?.postsTitle || 'Posts'

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{pageTitle}</h1>
        </div>
      </div>

      {indexPages?.postsHeaderImage && (
        <div className="container mb-16">
          <Media resource={indexPages.postsHeaderImage} className="w-full" />
        </div>
      )}

      {indexPages?.postsContent && (
        <div className="container mb-16">
          <RichText data={indexPages.postsContent} enableGutter={false} />
        </div>
      )}

      {indexPages?.postsBlocks && indexPages.postsBlocks.length > 0 && (
        <div className="container mb-16">
          <RenderBlocks blocks={indexPages.postsBlocks as Parameters<typeof RenderBlocks>[0]['blocks']} />
        </div>
      )}

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} relationTo="posts" showCategories />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const getIndexPages = getCachedGlobal('index-pages', 2)
  const indexPages = (await getIndexPages()) as IndexPage | null

  if (indexPages?.postsMeta) {
    return generateMeta({
      doc: {
        meta: indexPages.postsMeta,
        slug: 'posts',
      } as { meta: typeof indexPages.postsMeta; slug: string },
    })
  }

  return {
    title: `Payload Website Template Posts`,
  }
}

