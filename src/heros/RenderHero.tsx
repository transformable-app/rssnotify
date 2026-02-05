import React from 'react'

import type { Page } from '@/payload-types'

import { HeroSliderBlock } from '@/blocks/HeroSliderBlock/Component'
import { HighImpactHero } from '@/heros/HighImpact'
import { LowImpactHero } from '@/heros/LowImpact'
import { MediumImpactHero } from '@/heros/MediumImpact'

const heroes = {
  highImpact: HighImpactHero,
  lowImpact: LowImpactHero,
  mediumImpact: MediumImpactHero,
}

export const RenderHero: React.FC<Page['hero']> = (props) => {
  const { type } = props || {}

  if (!type || type === 'none') return null

  if (type === 'heroSlider') {
    const heroSliderProps = props as typeof props & {
      loop?: boolean | null
      autoPlay?: boolean | null
      autoplayDelay?: number | null
    }
    const { slides, showNavigation, loop, autoPlay, autoplayDelay } = heroSliderProps
    const slideList = Array.isArray(slides) && slides.length > 0 ? slides : []
    if (slideList.length === 0) return null

    return (
      <div className="-mt-[12rem] lg:-mt-[10.4rem]">
        <HeroSliderBlock
          slides={slideList as React.ComponentProps<typeof HeroSliderBlock>['slides']}
          showNavigation={showNavigation ?? true}
          loop={loop ?? true}
          autoPlay={autoPlay ?? true}
          autoplayDelay={autoplayDelay ?? 5000}
        />
      </div>
    )
  }

  const HeroToRender = heroes[type]
  if (!HeroToRender) return null

  return <HeroToRender {...props} />
}
