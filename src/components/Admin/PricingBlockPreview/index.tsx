'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentPricing, type ContentPricingPlan } from '@/components/Content/ContentPricing'

export type PricingBlockPreviewProps = {
  plans?: Array<{
    id?: string
    name?: string
    price?: number
    period?: string
    description?: string
    features?: Array<{ feature?: string }>
    highlighted?: boolean
    buttonText?: string
    buttonLink?: unknown
  }>
  columns?: string | number
  width?: 'content' | 'full'
}

export const PricingBlockPreview: React.FC<PricingBlockPreviewProps> = (props) => {
  const { plans = [], columns: columnsProp = '3', width = 'content' } = props

  if (!plans || plans.length === 0) {
    return (
      <Banner type="info">
        <p>No pricing plans configured. Add plans to see the preview.</p>
      </Banner>
    )
  }

  const pricingPlans: ContentPricingPlan[] = plans
    .filter((plan) => plan.name && typeof plan.price === 'number')
    .map((plan) => ({
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
      buttonLink: plan.buttonLink as ContentPricingPlan['buttonLink'],
    }))

  if (pricingPlans.length === 0) {
    return (
      <Banner type="info">
        <p>No valid pricing plans configured. Please add plans with names and prices.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Pricing Preview ({pricingPlans.length} plans, {columns} columns) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentPricing plans={pricingPlans} columns={columns} />
      </div>
    </div>
  )
}

export default PricingBlockPreview

