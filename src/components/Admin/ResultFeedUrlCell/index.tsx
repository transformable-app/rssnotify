import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { ExternalLink } from 'lucide-react'

const coerceUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  return value.trim() || null
}

const ResultFeedUrlCell: React.FC<DefaultCellComponentProps> = (props) => {
  const url = coerceUrl(props.cellData)
  if (!url) return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
    >
      <span>Open link</span>
      <ExternalLink size={14} aria-hidden />
    </a>
  )
}

export default ResultFeedUrlCell
