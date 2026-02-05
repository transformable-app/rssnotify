import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentFAQ, type ContentFAQItem } from '@/components/Content/ContentFAQ'
import RichText from '@/components/RichText'

type FAQBlockProps = {
  id?: string
  items?: Array<{
    id?: string
    question?: string
    answer?: DefaultTypedEditorState
  }>
  type?: 'single' | 'multiple'
  collapsible?: boolean
  width?: 'content' | 'full'
  blockType?: 'faq'
}

export const FAQBlock: React.FC<FAQBlockProps> = (props) => {
  const { id, items, type, collapsible, width = 'content' } = props

  if (!items || items.length === 0) {
    return null
  }

  const faqItems: ContentFAQItem[] = items
    .filter((item) => item.question && item.answer)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      question: typeof item.question === 'string' ? item.question : '',
      answer: item.answer ? <RichText data={item.answer} enableGutter={false} /> : null,
    }))

  if (faqItems.length === 0) {
    return null
  }

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentFAQ items={faqItems} type={type} collapsible={collapsible} />
    </div>
  )
}

