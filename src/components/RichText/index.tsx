import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
  QuoteBlock as QuoteBlockProps,
  AccordionBlock as AccordionBlockProps,
  TabsBlock as TabsBlockProps,
  ColumnsBlock as ColumnsBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { QuoteBlock } from '@/blocks/QuoteBlock/Component'
import { AccordionBlock } from '@/blocks/AccordionBlock/Component'
import { TabsBlock } from '@/blocks/TabsBlock/Component'
import { ColumnsBlock } from '@/blocks/ColumnsBlock/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | CTABlockProps
      | MediaBlockProps
      | BannerBlockProps
      | CodeBlockProps
      | QuoteBlockProps
      | AccordionBlockProps
      | TabsBlockProps
      | ColumnsBlockProps
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

// Helper to convert null values to undefined for component props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitizeProps = <T extends Record<string, any>>(props: T): any => {
  const sanitized = { ...props }
  for (const key in sanitized) {
    if (sanitized[key] === null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(sanitized as any)[key] = undefined
    }
  }
  return sanitized
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
    quote: ({ node }) => (
      <div className="col-start-2 mb-4">
        {/* @ts-ignore - sanitizeProps converts null to undefined, making types compatible */}
        <QuoteBlock {...sanitizeProps(node.fields)} />
      </div>
    ),
    accordion: ({ node }) => (
      <div className="col-start-2 mb-4">
        {/* @ts-ignore - sanitizeProps converts null to undefined, making types compatible */}
        <AccordionBlock {...sanitizeProps(node.fields)} />
      </div>
    ),
    tabs: ({ node }) => (
      <div className="col-start-2 mb-4">
        {/* @ts-ignore - sanitizeProps converts null to undefined, making types compatible */}
        <TabsBlock {...sanitizeProps(node.fields)} />
      </div>
    ),
    columns: ({ node }) => (
      <div className="col-start-2 mb-4">
        {/* @ts-ignore - sanitizeProps converts null to undefined, making types compatible */}
        <ColumnsBlock {...sanitizeProps(node.fields)} />
      </div>
    ),
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
