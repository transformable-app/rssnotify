import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
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

const NotificationsSourceUrlCell: React.FC<DefaultCellComponentProps> = (props) => {
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

export default NotificationsSourceUrlCell
