import React from 'react'
import { cn } from '@/utilities/ui'
import type { Page, Post } from '@/payload-types'

import { ContentPricing, type ContentPricingPlan } from '@/components/Content/ContentPricing'

type PricingBlockProps = {
  id?: string
  plans?: Array<{
    id?: string
    name?: string
    price?: number
    period?: string
    description?: string
    features?: Array<{ feature?: string }>
    highlighted?: boolean
    buttonText?: string
    buttonLink?: {
      type?: 'reference' | 'custom'
      url?: string
      label?: string
      newTab?: boolean
      reference?: {
        relationTo?: 'pages' | 'posts'
        value?: string | number | { slug?: string; id?: string }
      }
    }
  }>
  columns?: string | number
  width?: 'content' | 'full'
  blockType?: 'pricing'
}

export const PricingBlock: React.FC<PricingBlockProps> = (props) => {
  const { id, plans, columns, width = 'content' } = props

  if (!plans || plans.length === 0) {
    return null
  }

  const pricingPlans: ContentPricingPlan[] = plans
    .filter((plan) => plan.name && typeof plan.price === 'number')
    .map((plan) => {
      let buttonLink: ContentPricingPlan['buttonLink'] = undefined
      if (plan.buttonLink) {
        const ref = plan.buttonLink.reference
        buttonLink = {
          type: plan.buttonLink.type || 'custom',
          url: plan.buttonLink.url,
          label: plan.buttonLink.label,
          newTab: plan.buttonLink.newTab,
          reference:
            ref &&
            typeof ref.relationTo === 'string' &&
            (ref.relationTo === 'pages' || ref.relationTo === 'posts')
              ? {
                  relationTo: ref.relationTo as 'pages' | 'posts',
                  value: ref.value as Page | Post | string | number,
                }
              : undefined,
        }
      }

      return {
        id: typeof plan.id === 'string' ? plan.id : undefined,
        name: typeof plan.name === 'string' ? plan.name : '',
        price: typeof plan.price === 'number' ? plan.price : 0,
        period: typeof plan.period === 'string' ? plan.period : undefined,
        description: typeof plan.description === 'string' ? plan.description : undefined,
        features: Array.isArray(plan.features)
          ? plan.features
              .map((f) => (typeof f === 'object' && f && 'feature' in f ? f.feature : String(f)))
              .filter((f): f is string => typeof f === 'string')
          : undefined,
        highlighted: Boolean(plan.highlighted),
        buttonText: typeof plan.buttonText === 'string' ? plan.buttonText : undefined,
        buttonLink,
      }
    })

  if (pricingPlans.length === 0) {
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentPricing plans={pricingPlans} columns={validColumns} />
    </div>
  )
}

