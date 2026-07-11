import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { Payload, PayloadRequest } from 'payload'

const JOBS_COLLECTION = 'payload-jobs'
const JOBS_STATS_GLOBAL = 'payload-jobs-stats'
const BUILD_RESET_STATS_KEY = 'buildReset'

type JobsResetStats = {
  buildID?: string
  reason?: string
  resetAt?: string
}

type JobsOperationContext = {
  payload: Payload
  req?: PayloadRequest
}

export type JobsResetResult = {
  buildID?: string
  previousBuildID?: string
  reset: boolean
  reason: 'build-changed' | 'missing-build-id' | 'same-build'
}

const getString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed || undefined
}

const getNextBuildID = (): string | undefined => {
  const buildIDPaths = [
    path.resolve(process.cwd(), '.next', 'BUILD_ID'),
    path.resolve(process.cwd(), '.next', 'standalone', '.next', 'BUILD_ID'),
  ]

  for (const buildIDPath of buildIDPaths) {
    if (!existsSync(buildIDPath)) continue

    return getString(readFileSync(buildIDPath, 'utf8'))
  }

  return undefined
}

export const getCurrentJobsBuildID = (): string | undefined =>
  getString(process.env.PAYLOAD_JOBS_BUILD_ID) ||
  getString(process.env.VERCEL_GIT_COMMIT_SHA) ||
  getString(process.env.VERCEL_URL) ||
  getString(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) ||
  getNextBuildID()

const getBuildResetStats = (stats: unknown): JobsResetStats | undefined => {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return undefined

  const value = (stats as Record<string, unknown>)[BUILD_RESET_STATS_KEY]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  return value as JobsResetStats
}

export const resetAllJobs = async ({
  buildID,
  payload,
  reason,
  req,
}: JobsOperationContext & {
  buildID?: string
  reason?: string
}): Promise<void> => {
  await payload.delete({
    collection: JOBS_COLLECTION,
    where: { id: { exists: true } },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  const stats = buildID
    ? {
        [BUILD_RESET_STATS_KEY]: {
          buildID,
          reason,
          resetAt: new Date().toISOString(),
        },
      }
    : {}

  await payload.updateGlobal({
    slug: JOBS_STATS_GLOBAL,
    data: {
      stats,
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
}

export const resetJobsForNewBuild = async ({
  payload,
  req,
}: JobsOperationContext): Promise<JobsResetResult> => {
  const buildID = getCurrentJobsBuildID()

  if (!buildID) {
    return {
      reset: false,
      reason: 'missing-build-id',
    }
  }

  const jobsStats = await payload.findGlobal({
    slug: JOBS_STATS_GLOBAL,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
  const previousBuildID = getString(getBuildResetStats(jobsStats.stats)?.buildID)

  if (previousBuildID === buildID) {
    return {
      buildID,
      previousBuildID,
      reset: false,
      reason: 'same-build',
    }
  }

  await resetAllJobs({
    buildID,
    payload,
    reason: previousBuildID ? 'new-build' : 'initial-build-marker',
    req,
  })

  return {
    buildID,
    previousBuildID,
    reset: true,
    reason: 'build-changed',
  }
}
