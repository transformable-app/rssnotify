'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'

const JobsResetButton: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    const confirmed = window.confirm('Reset all jobs and scheduling stats? This cannot be undone.')
    if (!confirmed) return

    setIsResetting(true)
    setError(null)

    try {
      const res = await fetch('/api/jobs/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to reset jobs')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset jobs')
      setIsResetting(false)
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <Button onClick={handleReset} disabled={isResetting} appearance="danger">
        {isResetting ? 'Resetting...' : 'Reset all jobs'}
      </Button>
      {error ? (
        <p style={{ marginTop: '0.5rem', color: 'var(--theme-error-500)' }}>{error}</p>
      ) : null}
    </div>
  )
}

export default JobsResetButton
