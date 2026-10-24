// @vitest-environment node
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const handlerURL = pathToFileURL(
  join(dirname(require.resolve('@payload-enchants/docs-reorder')), 'handlers/saveChanges.js'),
).href
const { saveChanges, schema } = await import(/* @vite-ignore */ handlerURL)

describe('reorder plugin with patched Zod', () => {
  it('returns structured validation errors before checking access', async () => {
    const access = vi.fn()
    const response = await saveChanges({ access })({
      json: async () => ({ collection: 'rss-feeds', docs: [{ id: 'feed', modifiedTo: 'bad' }] }),
    } as unknown as PayloadRequest)

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      errors: [expect.objectContaining({ path: ['docs', 0, 'modifiedTo'] })],
    })
    expect(access).not.toHaveBeenCalled()
  })

  it('continues to accept numeric and string document IDs', () => {
    expect(
      schema.safeParse({
        collection: 'rss-feeds',
        docs: [
          { id: 'feed', modifiedTo: 1 },
          { id: 2, modifiedTo: 2 },
        ],
      }).success,
    ).toBe(true)
  })
})
