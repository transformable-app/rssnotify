'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@payloadcms/ui'

type ImportResponse = {
  created: number
  imported: number
  ok: boolean
  skipped: number
}

const RssFeedsImportExportActions: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const res = await fetch('/api/rss-feeds/export')

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to export feeds')
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const contentDisposition = res.headers.get('content-disposition')
      const match = contentDisposition?.match(/filename="([^"]+)"/)

      anchor.href = downloadUrl
      anchor.download = match?.[1] || 'rss-feeds.json'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export feeds')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setIsImporting(true)
    setError(null)

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      const res = await fetch('/api/rss-feeds/import', {
        body: JSON.stringify(parsed),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to import feeds')
      }

      const result = (await res.json()) as ImportResponse
      window.alert(`Processed ${result.imported} feeds. Created ${result.created}, skipped ${result.skipped}.`)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import feeds')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div
      className="rss-feeds-import-export-actions"
      style={{
        alignItems: 'flex-end',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'absolute',
        right: 'var(--gutter-h)',
        top: '3rem',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'flex-end',
        }}
      >
        <Button buttonStyle="secondary" disabled={isExporting || isImporting} onClick={handleExport}>
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
        <Button buttonStyle="secondary" disabled={isExporting || isImporting} onClick={handleImportClick}>
          {isImporting ? 'Importing...' : 'Import'}
        </Button>
      </div>
      <input
        accept="application/json,.json"
        hidden
        onChange={handleImportChange}
        ref={inputRef}
        type="file"
      />
      {error ? <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>{error}</p> : null}
      <style>{`
        .rss-feeds-import-export-actions {
          width: fit-content;
        }
      `}</style>
    </div>
  )
}

export default RssFeedsImportExportActions
