import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { GraphQLEnumType } from 'graphql'
import { describe, expect, it } from 'vitest'

// Resolve the transitive package used by Payload's Next integration, including pnpm patches.
const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('@payloadcms/next/routes'))
const graphqlDirectory = dirname(nextRequire.resolve('@payloadcms/graphql'))
const { formatOptions } = await import(
  pathToFileURL(join(graphqlDirectory, 'utilities/formatOptions.js')).href
)

describe('Payload GraphQL aspect ratio enums', () => {
  it('should build the application GraphQL schema without invalid enum names', async () => {
    const { default: configPromise } = await import('@payload-config')
    const { configToSchema } = await import(nextRequire.resolve('@payloadcms/graphql'))

    const config = await configPromise
    expect(() => configToSchema(config)).not.toThrow()
  })

  it('should build valid enums while preserving stored aspect ratio values', () => {
    const ratios = ['16:9', '4:3', '1:1', '21:9', 'auto']
    const type = new GraphQLEnumType({
      name: 'AspectRatio',
      values: formatOptions({ options: ratios.map((value) => ({ label: value, value })) }),
    })

    expect(type.serialize('16:9')).toBe('_16_9')
    for (const ratio of ratios) {
      expect(type.parseValue(type.serialize(ratio))).toBe(ratio)
    }
  })

  it('should preserve distinct UTC offset names', () => {
    const type = new GraphQLEnumType({
      name: 'Offset',
      values: formatOptions({ options: ['+05:30', '-05:30'] }),
    })

    expect(type.serialize('+05:30')).toBe('_TZOFFSET_PLUS_05_30')
    expect(type.serialize('-05:30')).toBe('_TZOFFSET_MINUS_05_30')
  })
})
