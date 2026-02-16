import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { LegacyHeader } from '@/types/legacy'

const emptyHeader: LegacyHeader = {}

export async function Header() {
  let headerData: LegacyHeader = emptyHeader
  try {
    headerData = await (
      getCachedGlobal as unknown as (slug: string, depth: number) => () => Promise<LegacyHeader>
    )('header', 2)()
  } catch {
    // Header global not in Payload config
  }
  return <HeaderClient data={headerData} />
}
