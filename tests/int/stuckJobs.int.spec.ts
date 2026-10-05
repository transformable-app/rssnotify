import type { Payload, PayloadRequest, Where } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { recoverStuckJobs, startStuckJobWatchdog } from '@/jobs/recoverStuckJobs'
import { tasks } from '@/jobs'

vi.mock('@/jobs/processFeeds', () => ({
  processFeedsTask: { slug: 'process-feeds', schedule: [{ cron: '* * * * *', queue: 'rss' }] },
}))
vi.mock('@/jobs/deliverNotifications', () => ({
  deliverNotificationsTask: { slug: 'deliver-notifications' },
}))
vi.mock('@/jobs/sendDigests', () => ({ sendDigestsTask: { slug: 'send-digests' } }))

// Match the operators used by recovery and Payload's cancellation guards.
function matches(doc: Record<string, unknown>, where: Where): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'and') return (value as Where[]).every((clause) => matches(doc, clause))
    if (key === 'or') return (value as Where[]).some((clause) => matches(doc, clause))
    const actual = key
      .split('.')
      .reduce<unknown>(
        (entry, part) =>
          entry && typeof entry === 'object' ? (entry as Record<string, unknown>)[part] : undefined,
        doc,
      )
    return Object.entries(value as Record<string, unknown>).every(([operator, expected]) => {
      if (operator === 'equals') return actual === expected
      if (operator === 'not_equals') return actual !== expected
      if (operator === 'exists') return (actual !== undefined && actual !== null) === expected
      if (operator === 'less_than') return typeof actual === 'string' && actual < String(expected)
      throw new Error(`Unsupported operator ${operator}`)
    })
  })
}

function mockPayload() {
  const cancel = vi.fn().mockResolvedValue(undefined)
  const destroy = vi.fn().mockResolvedValue(undefined)
  const payload = { jobs: { cancel }, destroy, logger: { error: vi.fn() } } as unknown as Payload
  return { payload, cancel, destroy }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('stuck job recovery', () => {
  it('unblocks process-feeds before the scheduler checks for existing jobs', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'))
    const blocker: Record<string, unknown> = {
      meta: { scheduled: true },
      processing: false,
      createdAt: '2026-10-03T12:00:00Z',
      waitUntil: '2026-10-03T12:15:00Z',
    }
    const { payload, cancel } = mockPayload()
    cancel.mockImplementation(async ({ where }: { where: Where }) => {
      if (matches(blocker, where)) blocker.error = { cancelled: true }
    })
    const defaultBeforeSchedule = vi.fn(async () => ({ shouldSchedule: Boolean(blocker.error) }))
    const beforeSchedule = tasks[0].schedule![0].hooks!.beforeSchedule!
    const args: Parameters<typeof beforeSchedule>[0] = {
      req: { payload } as PayloadRequest,
      defaultBeforeSchedule,
      jobStats: {},
      queueable: { scheduleConfig: { cron: '* * * * *', queue: 'rss' } },
    }
    expect(await beforeSchedule(args)).toEqual({ shouldSchedule: true })
    expect(cancel).toHaveBeenCalledWith(expect.objectContaining({ req: args.req }))
    expect(defaultBeforeSchedule).toHaveBeenCalledWith(args)
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      defaultBeforeSchedule.mock.invocationCallOrder[0],
    )
  })

  it('cancels overdue scheduled blockers and stalled workers, preserving other jobs', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'))
    const { payload, cancel } = mockPayload()
    await recoverStuckJobs(payload)
    expect(cancel).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess: true }))
    const where = cancel.mock.calls[0][0].where as Where
    const pending = {
      taskSlug: 'process-feeds',
      meta: { scheduled: true },
      processing: false,
      createdAt: '2026-10-03T12:00:00Z',
      updatedAt: '2026-10-03T12:00:00Z',
      waitUntil: '2026-10-03T12:15:00Z',
    }
    expect(matches(pending, where)).toBe(true)
    expect(matches({ ...pending, waitUntil: null }, where)).toBe(true)
    expect(matches({ ...pending, waitUntil: '2026-10-06T12:00:00Z' }, where)).toBe(false)
    expect(matches({ ...pending, waitUntil: '2026-10-05T11:00:00Z' }, where)).toBe(false)
    expect(matches({ ...pending, waitUntil: '2026-10-04T12:00:00Z' }, where)).toBe(false)
    expect(matches({ ...pending, createdAt: '2026-10-05T10:00:00Z' }, where)).toBe(false)
    expect(matches({ ...pending, meta: {} }, where)).toBe(false)
    expect(matches({ ...pending, processing: true, meta: {} }, where)).toBe(true)
    expect(
      matches({ ...pending, processing: true, updatedAt: '2026-10-05T10:00:00Z' }, where),
    ).toBe(false)
    // Payload adds these guards to cancel() before its database update.
    const guarded: Where = {
      and: [where, { completedAt: { exists: false } }, { hasError: { not_equals: true } }],
    }
    expect(matches({ ...pending, completedAt: '2026-10-03T13:00:00Z' }, guarded)).toBe(false)
    expect(matches({ ...pending, hasError: true }, guarded)).toBe(false)
  })

  it('shares concurrent checks and permits recovery after a failure', async () => {
    const { payload, cancel } = mockPayload()
    let reject!: (err: Error) => void
    cancel.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, rejectPromise) => {
          reject = rejectPromise
        }),
    )
    const first = recoverStuckJobs(payload)
    expect(recoverStuckJobs(payload)).toBe(first)
    reject(new Error('Database unavailable'))
    await expect(first).rejects.toThrow('Database unavailable')
    await recoverStuckJobs(payload)
    expect(cancel).toHaveBeenCalledTimes(2)
  })

  it('runs independently every five minutes and stops when Payload is destroyed', async () => {
    vi.useFakeTimers()
    vi.stubEnv('PAYLOAD_JOBS_AUTORUN', 'true')
    vi.stubEnv('NEXT_PHASE', '')
    vi.stubEnv('npm_lifecycle_event', 'test')
    const { payload, cancel, destroy } = mockPayload()
    startStuckJobWatchdog(payload)
    startStuckJobWatchdog(payload)
    await vi.advanceTimersByTimeAsync(0)
    expect(cancel).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(cancel).toHaveBeenCalledTimes(2)
    await payload.destroy()
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(cancel).toHaveBeenCalledTimes(2)
    expect(destroy).toHaveBeenCalledOnce()
  })

  it.each([
    ['PAYLOAD_JOBS_AUTORUN', 'false'],
    ['NEXT_PHASE', 'phase-production-build'],
    ['npm_lifecycle_event', 'build'],
  ])('does not start during disabled autorun or builds (%s)', (key, value) => {
    vi.useFakeTimers()
    vi.stubEnv('PAYLOAD_JOBS_AUTORUN', 'true')
    vi.stubEnv(key, value)
    const { payload, cancel } = mockPayload()
    startStuckJobWatchdog(payload)
    expect(cancel).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
