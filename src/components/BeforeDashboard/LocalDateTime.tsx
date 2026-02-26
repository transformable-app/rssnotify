'use client'

import React from 'react'

type Props = {
  value: string | null | undefined
}

export const LocalDateTime: React.FC<Props> = ({ value }) => {
  if (!value) return <>n/a</>

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return <>n/a</>

  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)}
    </time>
  )
}
