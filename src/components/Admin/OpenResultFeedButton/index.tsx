'use client'

import React from 'react'
import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { ExternalLink } from 'lucide-react'

const getFieldValue = (fields: Record<string, unknown>, name: string): unknown => {
  const field = fields[name]
  if (!field || typeof field !== 'object' || !('value' in field)) return undefined
  return (field as { value?: unknown }).value
}

const buildResultFeedPath = (args: {
  id?: number | string | null
  format?: unknown
  token?: unknown
  visibility?: unknown
}): string | null => {
  const { id, format, token, visibility } = args
  if (!id) return null

  const normalizedFormat = format === 'rss' ? 'rss' : 'atom'
  const normalizedVisibility = visibility === 'public' ? 'public' : 'private'
  const normalizedToken = typeof token === 'string' ? token.trim() : ''
  const tokenQuery =
    normalizedVisibility === 'private' && normalizedToken
      ? `?token=${encodeURIComponent(normalizedToken)}`
      : ''

  return `/api/result-feeds/${id}/feed.${normalizedFormat}${tokenQuery}`
}

const OpenResultFeedButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const feedURL = useFormFields(([fields]) =>
    buildResultFeedPath({
      id,
      format: getFieldValue(fields, 'format'),
      token: getFieldValue(fields, 'token'),
      visibility: getFieldValue(fields, 'visibility'),
    }),
  )

  if (!feedURL) return null

  return (
    <Button
      buttonStyle="secondary"
      el="anchor"
      url={feedURL}
      newTab
      icon={<ExternalLink size={14} />}
    >
      Open link
    </Button>
  )
}

export default OpenResultFeedButton
