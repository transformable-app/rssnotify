import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const payloadRequire = createRequire(require.resolve('payload'))
const deepmergeDirectory = dirname(dirname(payloadRequire.resolve('deepmerge')))
type Merge = (target: object, source: object) => Record<string | symbol, unknown>

// Exercise both distributed entry points from the patched dependency Payload resolves.
for (const entry of ['dist/cjs.js', 'dist/umd.js']) {
  const merge: Merge = require(join(deepmergeDirectory, entry))

  describe(`deepmerge prototype guard (${entry})`, () => {
    it('should discard an own __proto__ property copied from the target', () => {
      const target = JSON.parse('{"__proto__":{"polluted":true},"kept":1}')
      const result = merge(target, { added: 2 })

      expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
      expect(result.polluted).toBeUndefined()
      expect(Object.hasOwn(result, '__proto__')).toBe(false)
      expect(result).toEqual({ kept: 1, added: 2 })
    })

    it('should discard source __proto__ properties when the target has no prototype', () => {
      const source = JSON.parse('{"__proto__":{"polluted":true},"kept":1}')
      const result = merge(Object.create(null), source)

      expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
      expect(result.polluted).toBeUndefined()
      expect(Object.hasOwn(result, '__proto__')).toBe(false)
      expect(result).toEqual({ kept: 1 })
    })

    it('should guard nested objects and objects inside arrays', () => {
      const target = JSON.parse(
        '{"nested":{"__proto__":{"polluted":true}},"items":[{"__proto__":{"polluted":true}}]}',
      )
      const result = merge(target, {})
      const nested = result.nested as Record<string, unknown>
      const item = (result.items as Record<string, unknown>[])[0]

      for (const value of [nested, item]) {
        expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
        expect(value.polluted).toBeUndefined()
      }
    })

    it('should preserve recursive merges, array concatenation, and enumerable symbols', () => {
      const key = Symbol('metadata')
      const result = merge(
        { nested: { first: 1 }, items: [1], [key]: 'kept' },
        { nested: { second: 2 }, items: [2] },
      )

      expect(result).toEqual({ nested: { first: 1, second: 2 }, items: [1, 2], [key]: 'kept' })
    })
  })
}
