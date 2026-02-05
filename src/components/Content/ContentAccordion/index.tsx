import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/utilities/ui'

export type ContentAccordionItem = {
  id?: string
  title: string
  content: React.ReactNode
  description?: string
}

export type ContentAccordionProps = {
  items: ContentAccordionItem[]
  className?: string
  type?: 'single' | 'multiple'
  defaultValue?: string
  collapsible?: boolean
}

export const ContentAccordion: React.FC<ContentAccordionProps> = ({
  items,
  className,
  type = 'single',
  defaultValue,
  collapsible = true,
}) => {
  if (!items || items.length === 0) {
    return null
  }

  const accordionItems = items.map((item, index) => (
    <AccordionItem key={item.id || index} value={item.id || `item-${index}`}>
      <AccordionTrigger className="text-left">
        <div className="flex flex-col items-start">
          <span className="font-semibold">{item.title}</span>
          {item.description && (
            <span className="text-sm text-muted-foreground font-normal">
              {item.description}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2">{item.content}</div>
      </AccordionContent>
    </AccordionItem>
  ))

  return (
    <div className={cn('w-full', className)}>
      {type === 'multiple' ? (
        <Accordion type="multiple" className="w-full">
          {accordionItems}
        </Accordion>
      ) : (
        <Accordion
          type="single"
          defaultValue={defaultValue}
          collapsible={collapsible}
          className="w-full"
        >
          {accordionItems}
        </Accordion>
      )}
    </div>
  )
}

