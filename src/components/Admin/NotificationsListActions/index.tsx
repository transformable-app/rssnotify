'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@payloadcms/ui'

const REFRESH_INTERVAL_MS = 15000
const STORAGE_KEY = 'notifications-auto-refresh'

const NotificationsListActions: React.FC = () => {
  const [enabled, setEnabled] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      window.location.reload()
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled])

  const toggleEnabled = () => {
    setEnabled((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete all notifications? This cannot be undone.')
    if (!confirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/notifications/delete-all', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to delete notifications')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notifications')
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="notifications-list-actions"
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
        <Button
          aria-label="Toggle auto refresh (15s)"
          buttonStyle="secondary"
          onClick={toggleEnabled}
        >
          {enabled ? 'Auto refresh: on' : 'Auto refresh: off'}
        </Button>
        <Button buttonStyle="secondary" disabled={isDeleting} onClick={handleDelete}>
          {isDeleting ? 'Deleting...' : 'Delete all'}
        </Button>
      </div>
      {error ? <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>{error}</p> : null}
      <style>{`
        .notifications-list-actions {
          width: fit-content;
        }
      `}</style>
    </div>
  )
}

export default NotificationsListActions
