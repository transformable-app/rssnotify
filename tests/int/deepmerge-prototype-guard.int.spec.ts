import { deepMerge as merge } from 'payload'
import { describe, expect, it } from 'vitest'

// Payload 3.94.1 owns the merge implementation that replaces patched deepmerge.
describe('Payload deepMerge prototype guard', () => {
  it('should discard an own __proto__ property copied from the target', () => {
    const target = JSON.parse('{"__proto__":{"polluted":true},"kept":1}')
    const result = merge<Record<string, unknown>>(target, { added: 2 })

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.polluted).toBeUndefined()
    expect(Object.hasOwn(result, '__proto__')).toBe(false)
    expect(result).toEqual({ kept: 1, added: 2 })
  })

  it('should discard source __proto__ properties when the target has no prototype', () => {
    const source = JSON.parse('{"__proto__":{"polluted":true},"kept":1}')
    const result = merge<Record<string, unknown>>(Object.create(null), source)

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.polluted).toBeUndefined()
    expect(Object.hasOwn(result, '__proto__')).toBe(false)
    expect(result).toEqual({ kept: 1 })
  })

  it('should guard nested objects and objects inside arrays', () => {
    const target = JSON.parse(
      '{"nested":{"__proto__":{"polluted":true}},"items":[{"__proto__":{"polluted":true}}]}',
    )
    const result = merge<Record<string, unknown>>(target, {})
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
