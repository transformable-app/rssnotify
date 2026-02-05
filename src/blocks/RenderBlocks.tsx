import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { AccordionBlock } from '@/blocks/AccordionBlock/Component'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CardGridBlock } from '@/blocks/CardGridBlock/Component'
import { CarouselBlock } from '@/blocks/CarouselBlock/Component'
import { CodeBlock } from '@/blocks/Code/Component'
import { ColumnsBlock } from '@/blocks/ColumnsBlock/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FAQBlock } from '@/blocks/FAQBlock/Component'
import { FeaturesBlock } from '@/blocks/FeaturesBlock/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { GalleryBlock } from '@/blocks/GalleryBlock/Component'
import { HeroSliderBlock } from '@/blocks/HeroSliderBlock/Component'
import { LogosBlock } from '@/blocks/LogosBlock/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { NumbersBlock } from '@/blocks/NumbersBlock/Component'
import { ProcessBlock } from '@/blocks/ProcessBlock/Component'
import { PricingBlock } from '@/blocks/PricingBlock/Component'
import { QuoteBlock } from '@/blocks/QuoteBlock/Component'
import { StatsBlock } from '@/blocks/StatsBlock/Component'
import { TabsBlock } from '@/blocks/TabsBlock/Component'
import { TeamBlock } from '@/blocks/TeamBlock/Component'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/Component'
import { TimelineBlock } from '@/blocks/TimelineBlock/Component'
import { VideoBlock } from '@/blocks/VideoBlock/Component'

const blockComponents = {
  accordion: AccordionBlock,
  archive: ArchiveBlock,
  banner: BannerBlock,
  cardGrid: CardGridBlock,
  carousel: CarouselBlock,
  code: CodeBlock,
  columns: ColumnsBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  faq: FAQBlock,
  features: FeaturesBlock,
  formBlock: FormBlock,
  gallery: GalleryBlock,
  heroSlider: HeroSliderBlock,
  logos: LogosBlock,
  mediaBlock: MediaBlock,
  numbers: NumbersBlock,
  process: ProcessBlock,
  pricing: PricingBlock,
  quote: QuoteBlock,
  stats: StatsBlock,
  tabs: TabsBlock,
  team: TeamBlock,
  testimonials: TestimonialsBlock,
  timeline: TimelineBlock,
  video: VideoBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
