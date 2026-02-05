import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import { CMSLink } from '@/components/Link'
import type { Page, Post } from '@/payload-types'

export type ContentPricingPlan = {
  id?: string
  name: string
  price: number
  period?: string
  description?: string
  features?: string[]
  highlighted?: boolean
  buttonText?: string
  buttonLink?: {
    type?: 'reference' | 'custom'
    url?: string
    label?: string
    newTab?: boolean
    reference?: {
      relationTo?: 'pages' | 'posts'
      value?: Page | Post | string | number
    }
  }
}

export type ContentPricingProps = {
  plans: ContentPricingPlan[]
  className?: string
  columns?: 2 | 3 | 4
}

export const ContentPricing: React.FC<ContentPricingProps> = ({
  plans,
  className,
  columns = 3,
}) => {
  if (!plans || plans.length === 0) {
    return null
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', gridCols[columns], 'gap-6')}>
        {plans.map((plan, index) => (
          <Card
            key={plan.id || index}
            className={cn(
              'h-full flex flex-col',
              plan.highlighted && 'border-primary border-2 shadow-lg scale-105'
            )}
          >
            <CardHeader className={cn(plan.highlighted && 'bg-primary/5')}>
              {plan.highlighted && (
                <div className="text-xs font-semibold text-primary mb-2 uppercase">Popular</div>
              )}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
              </div>
              {plan.description && (
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              {plan.buttonLink && (
                <CMSLink
                  type={plan.buttonLink.type || 'custom'}
                  url={plan.buttonLink.url || null}
                  reference={
                    plan.buttonLink.reference &&
                    plan.buttonLink.reference.relationTo &&
                    plan.buttonLink.reference.value !== undefined
                      ? {
                          relationTo: plan.buttonLink.reference.relationTo,
                          value: plan.buttonLink.reference.value,
                        }
                      : null
                  }
                  newTab={plan.buttonLink.newTab || null}
                  appearance={plan.highlighted ? 'default' : 'outline'}
                  className="w-full"
                >
                  {plan.buttonText || 'Get Started'}
                </CMSLink>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

