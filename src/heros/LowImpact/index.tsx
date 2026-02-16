import React from 'react'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | { children?: React.ReactNode; richText?: never }
  | { children?: never; richText?: unknown }

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <div className="container mt-16">
      <div className="max-w-[48rem]">
        {children ?? (richText ? <RichText data={richText as never} enableGutter={false} /> : null)}
      </div>
    </div>
  )
}
