'use client'

import React, { useState } from 'react'

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
    <div className="jobs-schedule-view__reset">
      <button
        className="jobs-schedule-view__reset-button"
        onClick={handleReset}
        disabled={isResetting}
        type="button"
      >
        {isResetting ? 'Resetting...' : 'Reset all jobs'}
      </button>
      <p className="jobs-schedule-view__reset-help">
        Resets the job queue and scheduling stats so all jobs can be re-enqueued from a clean state.
      </p>
      {error ? (
        <p className="jobs-schedule-view__reset-error">{error}</p>
      ) : null}
    </div>
  )
}

export default JobsResetButton
