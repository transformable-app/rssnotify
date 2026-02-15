import type { GlobalConfig } from 'payload'

import { AccordionBlock } from '@/blocks/AccordionBlock/config'
import { Archive } from '@/blocks/ArchiveBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { CardGridBlock } from '@/blocks/CardGridBlock/config'
import { CarouselBlock } from '@/blocks/CarouselBlock/config'
import { ColumnsBlock } from '@/blocks/ColumnsBlock/config'
import { Content } from '@/blocks/Content/config'
import { FAQBlock } from '@/blocks/FAQBlock/config'
import { FeaturesBlock } from '@/blocks/FeaturesBlock/config'
import { FormBlock } from '@/blocks/Form/config'
import { GalleryBlock } from '@/blocks/GalleryBlock/config'
import { LogosBlock } from '@/blocks/LogosBlock/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { PricingBlock } from '@/blocks/PricingBlock/config'
import { QuoteBlock } from '@/blocks/QuoteBlock/config'
import { StatsBlock } from '@/blocks/StatsBlock/config'
import { TabsBlock } from '@/blocks/TabsBlock/config'
import { TeamBlock } from '@/blocks/TeamBlock/config'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/config'
import { TimelineBlock } from '@/blocks/TimelineBlock/config'
import { VideoBlock } from '@/blocks/VideoBlock/config'
import { revalidateIndexPages } from './hooks/revalidateIndexPages'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const IndexPages: GlobalConfig = {
  slug: 'index-pages',
  access: {
    read: () => true,
  },
  admin: {
    hidden: true,
    group: 'Settings',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Posts',
          fields: [
            {
              name: 'postsTitle',
              type: 'text',
              admin: {
                description: 'Page title displayed on the posts index page. Defaults to "Posts" if not set.',
              },
            },
            {
              name: 'postsHeaderImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Header image displayed above the posts index page content.',
              },
            },
            {
              name: 'postsContent',
              type: 'richText',
              admin: {
                description: 'Content displayed above the posts list.',
              },
            },
            {
              name: 'postsBlocks',
              type: 'blocks',
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                FormBlock,
                CarouselBlock,
                LogosBlock,
                AccordionBlock,
                TabsBlock,
                ColumnsBlock,
                CardGridBlock,
                StatsBlock,
                TestimonialsBlock,
                GalleryBlock,
                FeaturesBlock,
                QuoteBlock,
                TimelineBlock,
                VideoBlock,
                FAQBlock,
                PricingBlock,
                TeamBlock,
              ],
              admin: {
                description: 'Blocks displayed above the posts list.',
                initCollapsed: true,
              },
            },
            {
              name: 'postsMeta',
              label: 'SEO',
              type: 'group',
              fields: [
                OverviewField({
                  titlePath: 'postsMeta.title',
                  descriptionPath: 'postsMeta.description',
                  imagePath: 'postsMeta.image',
                }),
                MetaTitleField({
                  hasGenerateFn: true,
                }),
                MetaImageField({
                  relationTo: 'media',
                }),
                MetaDescriptionField({}),
                PreviewField({
                  hasGenerateFn: true,
                  titlePath: 'postsMeta.title',
                  descriptionPath: 'postsMeta.description',
                }),
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateIndexPages],
  },
}
