// @vitest-environment node
import { readdir, type Dirent } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const eslintRequire = createRequire(require.resolve('eslint'))
type GlobOptions = {
  cwd: string
  nodir?: boolean
  ignore?: string[]
  signal?: AbortSignal
  fs?: { readdir: typeof readdir }
}
type GlobModule = {
  glob: (pattern: string | string[], options: GlobOptions) => Promise<string[]>
  globSync: (pattern: string, options: GlobOptions) => string[]
  globStream: (pattern: string, options: GlobOptions) => AsyncIterable<string>
}
const copyfilesRequire = createRequire(require.resolve('copyfiles'))
const glob: GlobModule = copyfilesRequire('glob')
const copyfiles: (
  paths: string[],
  options: { up?: boolean; exclude?: string },
  callback: (error?: Error) => void,
) => void = require('copyfiles')
const minimatch: {
  minimatch: (path: string, pattern: string) => boolean
  Minimatch: new (
    pattern: string,
    options: { optimizationLevel: number; braceExpandMax: number },
  ) => { globParts: string[][] }
} = eslintRequire('minimatch')

describe('glob dependency compatibility', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'rssnotify-glob-'))
    await mkdir(join(directory, 'nested'))
    await writeFile(join(directory, 'nested', 'page.html'), 'page')
    await writeFile(join(directory, 'nested', 'skip.html'), 'skip')
    await writeFile(join(directory, 'nested', 'code.ts'), 'code')
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('should preserve brace and extglob matching used by lint configuration', () => {
    expect(minimatch.minimatch('src/page.tsx', 'src/**/*.{ts,tsx}')).toBe(true)
    expect(minimatch.minimatch('src/page.js', 'src/**/*.@(ts|tsx)')).toBe(false)
  })

  it('should bound amplified parent glob patterns during aggressive optimization', () => {
    const matcher = new minimatch.Minimatch('**/../a/b/'.repeat(8) + '*.ts', {
      optimizationLevel: 2,
      braceExpandMax: 64,
    })

    expect(matcher.globParts.length).toBeLessThanOrEqual(64)
  })

  it('should preserve synchronous globbing', () => {
    expect(glob.globSync('**/*.ts', { cwd: directory })).toEqual(['nested/code.ts'])
  })

  it('should copy recursive brace patterns through the copyfiles callback API', async () => {
    const destination = join(directory, 'output')
    await new Promise<void>((resolve, reject) => {
      copyfiles(
        [join(directory, '**', '*.{html,ts}'), destination],
        { up: true, exclude: '**/skip.html' },
        (error) => (error ? reject(error) : resolve()),
      )
    })

    expect(await readFile(join(destination, 'page.html'), 'utf8')).toBe('page')
    expect(await readFile(join(destination, 'code.ts'), 'utf8')).toBe('code')
    await expect(readFile(join(destination, 'skip.html'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('should deliver rejected glob promises to the copyfiles callback', async () => {
    const copy = new Promise<void>((resolve, reject) => {
      copyfiles([join(directory, 'a'.repeat(65537)), join(directory, 'output')], {}, (error) =>
        error ? reject(error) : resolve(),
      )
    })

    await expect(copy).rejects.toThrow('pattern is too long')
  })

  it.each(['promise', 'stream'] as const)(
    'should stop directory reads after cancellation during a %s walk',
    async (mode) => {
      const controller = new AbortController()
      const reason = new Error('cancel traversal')
      let reads = 0
      let completeRead!: () => void
      const readCompleted = new Promise<void>((resolve) => {
        completeRead = resolve
      })
      const trackedReaddir = ((
        path: string,
        options: { withFileTypes: true },
        callback: (error: NodeJS.ErrnoException | null, entries: Dirent[]) => void,
      ) => {
        reads++
        controller.abort(reason)
        readdir(path, options, (error, entries) => {
          callback(error, entries)
          completeRead()
        })
      }) as typeof readdir
      const options = {
        cwd: directory,
        signal: controller.signal,
        fs: { readdir: trackedReaddir },
      }
      const walk =
        mode === 'promise'
          ? glob.glob('**/*', options)
          : (async () => {
              for await (const _entry of glob.globStream('**/*', options)) {
                /* drain */
              }
            })()

      await expect(walk).rejects.toBe(reason)
      // Release the in-flight read before checking that it spawned no child reads.
      await readCompleted
      await setImmediate()
      expect(reads).toBe(1)
    },
  )
})
