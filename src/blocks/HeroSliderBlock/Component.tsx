'use client'

import React, { useState } from 'react'
import Autoplay from 'embla-carousel-autoplay'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

function HeroSlideLogo({
  resource,
  priority,
}: {
  resource: NonNullable<HeroSliderSlide['logo']> & object
  priority: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className="flex max-h-[320px] max-w-[320px] flex-shrink-0 items-center justify-end animate-fade-in transition-opacity duration-300 lg:max-h-[635px] lg:max-w-[635px]"
      style={{ opacity: loaded ? 1 : 0 }}
    >
      <Media
        resource={resource as never}
        imgClassName="h-auto max-h-[320px] w-auto max-w-[320px] object-contain lg:max-h-[635px] lg:max-w-[635px]"
        priority={priority}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

type HeroSliderSlide = {
  id?: string | null
  richText?: unknown
  links?: Array<{ link: unknown }>
  media?: string | { id?: string; url?: string; [key: string]: unknown }
  logo?: string | { id?: string; url?: string; [key: string]: unknown }
}

type HeroSliderBlockProps = {
  id?: string
  blockType?: 'heroSlider'
  slides?: HeroSliderSlide[] | null
  showNavigation?: boolean | null
  loop?: boolean | null
  autoPlay?: boolean | null
  autoplayDelay?: number | null
}

export const HeroSliderBlock: React.FC<HeroSliderBlockProps> = (props) => {
  const { id, slides, showNavigation = true, loop = true, autoPlay = true, autoplayDelay = 5000 } = props

  const slideList = Array.isArray(slides) && slides.length > 0 ? slides : []

  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: autoplayDelay ?? 5000, stopOnInteraction: true }),
    [autoplayDelay],
  )

  if (slideList.length === 0) return null

  return (
    <div className="relative flex min-h-[80vh] items-center text-white" id={id ? `block-${id}` : undefined} data-theme="dark">
      <Carousel
        className="w-full"
        opts={{
          align: 'start',
          loop: loop ?? true,
          duration: 30,
        }}
        plugins={autoPlay ? [autoplayPlugin] : []}
      >
        <CarouselContent className="-ml-0">
          {slideList.map((slide, index) => (
            <CarouselItem key={slide.id ?? index} className="relative min-h-[70vh] pl-0">
              <div className="relative flex min-h-[70vh] w-full items-center">
                <div className="container relative z-10 mb-4 flex w-full flex-col items-center gap-8 pt-[12rem] lg:pt-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="hero-slider-content min-w-0 flex-shrink-0 text-center lg:flex-[1.2] lg:max-w-none lg:text-left [&_h1]:font-anton [&_h1]:text-[#FFF5D0] [&_h1]:text-[3.5rem] [&_h1]:leading-[1.05] [&_h1]:uppercase lg:[&_h1]:text-[7.5rem] [&_p]:font-inter [&_p]:font-bold [&_p]:text-2xl [&_p]:text-white">
                    {slide.richText ? (
                      <RichText
                        className="mb-6"
                        data={slide.richText as never}
                        enableGutter={false}
                        enableProse={false}
                      />
                    ) : null}
                    {Array.isArray(slide.links) && slide.links.length > 0 && (
                      <ul className="hero-slider-buttons flex flex-wrap justify-center gap-4 [&_.hero-slider-btn-default]:rounded-2xl [&_.hero-slider-btn-default]:bg-[#FFF5D0] [&_.hero-slider-btn-default]:font-inter [&_.hero-slider-btn-default]:font-bold [&_.hero-slider-btn-default]:text-base [&_.hero-slider-btn-default]:text-[#F9600B] [&_.hero-slider-btn-outline]:rounded-2xl [&_.hero-slider-btn-outline]:border [&_.hero-slider-btn-outline]:border-[#FFF5D0] [&_.hero-slider-btn-outline]:bg-[#F9600B] [&_.hero-slider-btn-outline]:font-inter [&_.hero-slider-btn-outline]:font-bold [&_.hero-slider-btn-outline]:text-base [&_.hero-slider-btn-outline]:text-[#FFF5D0] lg:justify-start">
                        {slide.links.map(({ link }, i) => {
                          const linkObj = typeof link === 'object' && link !== null ? link : {}
                          const isOutline = linkObj && typeof linkObj === 'object' && 'appearance' in linkObj && linkObj.appearance === 'outline'
                          return (
                            <li key={i}>
                              <CMSLink
                                {...linkObj}
                                className={isOutline ? 'hero-slider-btn-outline' : 'hero-slider-btn-default'}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  {slide.logo && typeof slide.logo === 'object' && (
                    <HeroSlideLogo resource={slide.logo} priority={index === 0} />
                  )}
                </div>
                <div className="absolute inset-0 -z-10 min-h-[80vh] select-none">
                  {slide.media && typeof slide.media === 'object' && (
                    <Media
                      fill
                      imgClassName="object-cover"
                      priority={index === 0}
                      resource={slide.media as never}
                    />
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showNavigation && (
          <>
            <CarouselPrevious className="!flex absolute left-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white bg-black/30 text-white hover:bg-white/20 hover:text-white lg:left-6 lg:h-12 lg:w-12" />
            <CarouselNext className="!flex absolute right-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white bg-black/30 text-white hover:bg-white/20 hover:text-white lg:right-6 lg:h-12 lg:w-12" />
          </>
        )}
      </Carousel>
    </div>
  )
}
