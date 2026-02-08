'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'

const NotificationsDeleteAll: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button onClick={handleDelete} disabled={isDeleting} buttonStyle="secondary">
        {isDeleting ? 'Deleting...' : 'Delete all notifications'}
      </Button>
      {error ? (
        <p style={{ marginTop: '0.5rem', color: 'var(--theme-error-500)' }}>{error}</p>
      ) : null}
    </div>
  )
}

export default NotificationsDeleteAll
