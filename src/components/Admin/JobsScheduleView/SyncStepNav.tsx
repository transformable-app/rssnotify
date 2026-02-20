'use client'

import React from 'react'
import { SetDocumentStepNav, useDocumentInfo } from '@payloadcms/ui'

const SyncStepNav: React.FC = () => {
  const { globalSlug } = useDocumentInfo()

  if (!globalSlug) {
    return null
  }

  return <SetDocumentStepNav globalSlug={globalSlug} />
}

export default SyncStepNav
