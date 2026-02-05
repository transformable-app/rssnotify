import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/utilities/ui'

export type ContentFAQItem = {
  id?: string
  question: string
  answer: React.ReactNode
}

export type ContentFAQProps = {
  items: ContentFAQItem[]
  className?: string
  type?: 'single' | 'multiple'
  collapsible?: boolean
}

export const ContentFAQ: React.FC<ContentFAQProps> = ({
  items,
  className,
  type = 'single',
  collapsible = true,
}) => {
  if (!items || items.length === 0) {
    return null
  }

  const faqItems = items.map((item, index) => (
    <AccordionItem key={item.id || index} value={item.id || `faq-${index}`}>
      <AccordionTrigger className="text-left font-semibold">
        {item.question}
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 text-muted-foreground">{item.answer}</div>
      </AccordionContent>
    </AccordionItem>
  ))

  return (
    <div className={cn('w-full', className)}>
      {type === 'multiple' ? (
        <Accordion type="multiple" className="w-full">
          {faqItems}
        </Accordion>
      ) : (
        <Accordion type="single" collapsible={collapsible} className="w-full">
          {faqItems}
        </Accordion>
      )}
    </div>
  )
}

