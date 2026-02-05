'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentFAQ, type ContentFAQItem } from '@/components/Content/ContentFAQ'

export type FAQBlockPreviewProps = {
  items?: Array<{
    id?: string
    question?: string
    answer?: unknown
  }>
  type?: 'single' | 'multiple'
  collapsible?: boolean
  width?: 'content' | 'full'
}

export const FAQBlockPreview: React.FC<FAQBlockPreviewProps> = (props) => {
  const { items = [], type = 'single', collapsible = true, width = 'content' } = props

  if (!items || items.length === 0) {
    return (
      <Banner type="info">
        <p>No FAQ items configured. Add items to see the preview.</p>
      </Banner>
    )
  }

  const faqItems: ContentFAQItem[] = items
    .filter((item) => item.question && item.answer)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      question: typeof item.question === 'string' ? item.question : '',
      answer: item.answer ? (
        <div>{typeof item.answer === 'string' ? item.answer : 'Rich text content'}</div>
      ) : null,
    }))

  if (faqItems.length === 0) {
    return (
      <Banner type="info">
        <p>No valid FAQ items configured. Please add items with questions and answers.</p>
      </Banner>
    )
  }

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          FAQ Preview ({faqItems.length} items, {type} mode) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentFAQ items={faqItems} type={type} collapsible={collapsible} />
      </div>
    </div>
  )
}

export default FAQBlockPreview

