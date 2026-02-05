import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

export type ContentTabItem = {
  id?: string
  label: string
  content: React.ReactNode
  description?: string
}

export type ContentTabsProps = {
  items: ContentTabItem[]
  className?: string
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
}

export const ContentTabs: React.FC<ContentTabsProps> = ({
  items,
  className,
  defaultValue,
  orientation = 'horizontal',
}) => {
  if (!items || items.length === 0) {
    return null
  }

  const defaultTab = defaultValue || items[0]?.id || `tab-0`

  return (
    <div className={cn('w-full', className)}>
      <Tabs defaultValue={defaultTab} orientation={orientation} className="w-full">
        <TabsList className={cn(orientation === 'vertical' && 'flex-col h-auto')}>
          {items.map((item, index) => (
            <TabsTrigger key={item.id || index} value={item.id || `tab-${index}`}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, index) => (
          <TabsContent key={item.id || index} value={item.id || `tab-${index}`} className="mt-4">
            <Card>
              {item.description && (
                <CardHeader>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              )}
              <CardContent>{item.content}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

