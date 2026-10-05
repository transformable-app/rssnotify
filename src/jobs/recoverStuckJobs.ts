import type { Payload, PayloadRequest, Where } from 'payload'

const STUCK_JOB_AGE_MS = 24 * 60 * 60 * 1000
const RECOVERY_INTERVAL_MS = 5 * 60 * 1000
const activeRecoveries = new WeakMap<Payload, Promise<void>>()
const watchdogs = new WeakSet<Payload>()

/** Cancel stale blockers without clearing unrelated jobs or scheduling stats. */
export function recoverStuckJobs(payload: Payload, req?: PayloadRequest): Promise<void> {
  const active = activeRecoveries.get(payload)
  if (active) return active

  const cutoff = new Date(Date.now() - STUCK_JOB_AGE_MS).toISOString()
  const where: Where = {
    or: [
      {
        and: [{ processing: { equals: true } }, { updatedAt: { less_than: cutoff } }],
      },
      {
        and: [
          { processing: { not_equals: true } },
          { 'meta.scheduled': { equals: true } },
          { createdAt: { less_than: cutoff } },
          {
            or: [{ waitUntil: { exists: false } }, { waitUntil: { less_than: cutoff } }],
          },
        ],
      },
    ],
  }

  // System maintenance intentionally bypasses access control. Payload's cancel API
  // excludes completed/failed jobs and applies the predicate during the DB update.
  const recovery = payload.jobs.cancel({ where, overrideAccess: true, ...(req ? { req } : {}) }).finally(() => {
    activeRecoveries.delete(payload)
  })
  activeRecoveries.set(payload, recovery)
  return recovery
}

/** Runs outside the job queue, including while the autorun worker is occupied. */
export function startStuckJobWatchdog(payload: Payload): void {
  if (watchdogs.has(payload)) return
  if (
    process.env.PAYLOAD_JOBS_AUTORUN !== 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build'
  )
    return

  watchdogs.add(payload)
  const recover = () =>
    recoverStuckJobs(payload).catch((err: unknown) => {
      payload.logger.error({ err, msg: 'Failed to recover stuck Payload jobs' })
    })
  const timer = setInterval(() => {
    void recover()
  }, RECOVERY_INTERVAL_MS)
  timer.unref()
  void recover()

  const destroy = payload.destroy.bind(payload)
  payload.destroy = async () => {
    clearInterval(timer)
    watchdogs.delete(payload)
    try {
      await activeRecoveries.get(payload)
    } finally {
      await destroy()
    }
  }
}
