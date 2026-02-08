'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@payloadcms/ui'

const REFRESH_INTERVAL_MS = 15000
const STORAGE_KEY = 'notifications-auto-refresh'

const NotificationsAutoRefresh: React.FC = () => {
  const [enabled, setEnabled] = useState(false)
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

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <Button
        onClick={toggleEnabled}
        buttonStyle="secondary"
        title="Toggle auto refresh (15s)"
      >
        {enabled ? 'Auto refresh: on' : 'Auto refresh: off'}
      </Button>
    </div>
  )
}

export default NotificationsAutoRefresh
