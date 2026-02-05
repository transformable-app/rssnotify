'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Database seeded! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
  </div>
)

export const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (seeded) {
        toast.info('Database already seeded.')
        return
      }
      if (loading) {
        toast.info('Seeding already in progress.')
        return
      }
      if (error) {
        toast.error(`An error occurred, please refresh and try again.`)
        return
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        'Warning: This will reset all current data and load default data. Are you sure you want to continue?'
      )

      if (!confirmed) {
        return
      }

      setLoading(true)

      try {
        await toast.promise(
          new Promise((resolve, reject) => {
            try {
              fetch('/next/seed', { method: 'POST', credentials: 'include' })
                .then((res) => {
                  if (res.ok) {
                    resolve(true)
                    setSeeded(true)
                    setLoading(false)
                  } else {
                    setLoading(false)
                    reject('An error occurred while seeding.')
                  }
                })
                .catch((error) => {
                  setLoading(false)
                  reject(error)
                })
            } catch (error) {
              setLoading(false)
              reject(error)
            }
          }),
          {
            loading: 'Loading default data....',
            success: <SuccessMessage />,
            error: 'An error occurred while loading data.',
          },
        )
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        setError(error)
        setLoading(false)
      }
    },
    [loading, seeded, error],
  )

  let message = ''
  if (loading) message = ' (loading...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button className="seedButton" onClick={handleClick}>
        Load default data. Warning will reset all current data.
      </button>
      {message}
    </Fragment>
  )
}
