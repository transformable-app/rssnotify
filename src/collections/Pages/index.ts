import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { AccordionBlock } from '../../blocks/AccordionBlock/config'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { Banner } from '../../blocks/Banner/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { CardGridBlock } from '../../blocks/CardGridBlock/config'
import { CarouselBlock } from '../../blocks/CarouselBlock/config'
import { Code } from '../../blocks/Code/config'
import { ColumnsBlock } from '../../blocks/ColumnsBlock/config'
import { Content } from '../../blocks/Content/config'
import { FAQBlock } from '../../blocks/FAQBlock/config'
import { FeaturesBlock } from '../../blocks/FeaturesBlock/config'
import { FormBlock } from '../../blocks/Form/config'
import { GalleryBlock } from '../../blocks/GalleryBlock/config'
import { HeroSliderBlock as HeroSliderBlockConfig } from '../../blocks/HeroSliderBlock/config'
import { LogosBlock as LogosBlockConfig } from '../../blocks/LogosBlock/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { NumbersBlock as NumbersBlockConfig } from '../../blocks/NumbersBlock/config'
import { ProcessBlock as ProcessBlockConfig } from '../../blocks/ProcessBlock/config'
import { PricingBlock } from '../../blocks/PricingBlock/config'
import { QuoteBlock } from '../../blocks/QuoteBlock/config'
import { StatsBlock } from '../../blocks/StatsBlock/config'
import { TabsBlock } from '../../blocks/TabsBlock/config'
import { TeamBlock } from '../../blocks/TeamBlock/config'
import { TestimonialsBlock } from '../../blocks/TestimonialsBlock/config'
import { TimelineBlock } from '../../blocks/TimelineBlock/config'
import { VideoBlock } from '../../blocks/VideoBlock/config'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    hidden: true,
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                FormBlock,
                CarouselBlock,
                HeroSliderBlockConfig,
                LogosBlockConfig,
                NumbersBlockConfig,
                ProcessBlockConfig,
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
                Banner,
                Code,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
