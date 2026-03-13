'use client'

import React from 'react'
import { Button, useFormFields } from '@payloadcms/ui'
import { ExternalLink } from 'lucide-react'

const coerceUrl = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object') {
    const asRecord = value as Record<string, unknown>
    const url = typeof asRecord.url === 'string' ? asRecord.url : undefined
    const href = typeof asRecord.href === 'string' ? asRecord.href : undefined
    return (url || href || '').trim() || null
  }
  return null
}

const OpenSourceURLButton: React.FC = () => {
  const sourceURL = useFormFields(([fields]) => {
    const value = fields?.sourceURL
    if (!value || typeof value !== 'object' || !('value' in value)) return null
    return coerceUrl((value as { value?: unknown }).value)
  })

  if (!sourceURL) return null

  return (
    <Button
      buttonStyle="secondary"
      el="anchor"
      url={sourceURL}
      newTab
      icon={<ExternalLink size={14} />}
    >
      Open link
    </Button>
  )
}

export default OpenSourceURLButton
