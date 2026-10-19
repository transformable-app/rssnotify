// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

type AstNode = {
  type: string
  value?: string
  nodes?: AstNode[]
  parent?: AstNode
}
type Braces = {
  parse: (input: string) => AstNode
  compile: (input: string | AstNode) => string
  expand: (input: string | AstNode) => string[]
  stringify: (input: string | AstNode, options?: { escapeInvalid: boolean }) => string
}

const require = createRequire(import.meta.url)
const tailwindRequire = createRequire(require.resolve('tailwindcss'))
const micromatchRequire = createRequire(tailwindRequire.resolve('micromatch'))
const chokidarRequire = createRequire(tailwindRequire.resolve('chokidar'))
const bracesPath = micromatchRequire.resolve('braces')
const braces: Braces = micromatchRequire('braces')
const methods = ['compile', 'expand', 'stringify'] as const
const nestedPattern = (depth: number) => '{a,'.repeat(depth) + 'a' + '}'.repeat(depth)
const nestedAst = (depth: number): AstNode => {
  let node: AstNode = { type: 'text', value: 'a' }
  for (let i = 0; i < depth; i++) node = { type: 'paren', nodes: [node] }
  return { type: 'root', nodes: [node] }
}

describe('braces local depth guard', () => {
  it('should apply the locally patched package to both installed consumers', () => {
    expect(chokidarRequire.resolve('braces')).toBe(bracesPath)
    expect(micromatchRequire('braces/package.json')).toMatchObject({
      name: 'braces',
      version: '3.0.3',
    })
  })

  it('should accept 100 nested brace levels', () => {
    expect(braces.expand(nestedPattern(100))).toHaveLength(101)
  })

  it('should accept 100 nested parentheses during expansion', () => {
    const input = '('.repeat(100) + 'a' + ')'.repeat(100)
    expect(braces.expand(input)).toEqual([input])
  })

  it('should count nesting instead of the total number of containers', () => {
    expect(braces.compile('{a,b}'.repeat(200))).toBe('(a|b)'.repeat(200))
  })

  it.each(['"' + '{'.repeat(101) + '"', '[' + '('.repeat(101) + ']', '\\{'.repeat(101)])(
    'should preserve literal container characters in %s',
    (input) => {
      expect(() => braces.parse(input)).not.toThrow()
    },
  )

  it.each([
    ['braces', nestedPattern(101)],
    ['parentheses', '('.repeat(101) + 'a' + ')'.repeat(101)],
    ['mixed containers', '{('.repeat(51) + 'a' + ')}'.repeat(51)],
    ['unclosed containers', '{'.repeat(101)],
  ])('should reject excessive nesting of %s during parsing', (_name, input) => {
    expect(() => braces.parse(input)).toThrow(SyntaxError)
  })

  it.each(methods)('should reject deep strings below the length cap through %s', (method) => {
    const input = '{'.repeat(4998) + 'a,b' + '}'.repeat(4998)
    expect(input).toHaveLength(9999)
    expect(() => braces[method](input)).toThrow('Input nesting depth exceeds max depth (100)')
  })

  it.each(methods)('should accept a direct AST at the depth boundary through %s', (method) => {
    expect(() => braces[method](nestedAst(100))).not.toThrow()
  })

  it.each(methods)('should reject excessive direct AST depth through %s', (method) => {
    expect(() => braces[method](nestedAst(20000))).toThrow(SyntaxError)
  })

  // Run cyclic inputs in a child process: a guard regression must fail within
  // the timeout instead of hanging the test runner.
  it.each(methods)('should terminate child-node cycles through %s', (method) => {
    const code = `
      const assert = require('node:assert/strict');
      const braces = require(${JSON.stringify(bracesPath)});
      const ast = { type: 'root', nodes: [] };
      ast.nodes.push(ast);
      assert.throws(() => braces.${method}(ast), SyntaxError);
    `
    expect(() => execFileSync(process.execPath, ['-e', code], { timeout: 3000 })).not.toThrow()
  })

  it.each(['parent', 'block'])('should bound the %s pointer walk during expansion', (walk) => {
    const code = `
      const assert = require('node:assert/strict');
      const braces = require(${JSON.stringify(bracesPath)});
      const paren = { type: 'paren', nodes: [] };
      paren.parent = paren;
      const ast = ${JSON.stringify(walk)} === 'block'
        ? paren
        : { type: 'root', nodes: [paren] };
      if (${JSON.stringify(walk)} === 'parent') paren.nodes.push({ type: 'paren', nodes: [] });
      assert.throws(() => braces.expand(ast), SyntaxError);
    `
    expect(() => execFileSync(process.execPath, ['-e', code], { timeout: 3000 })).not.toThrow()
  })

  it('should compile ordinary nested globs', () => {
    expect(braces.compile('src/{a,b}/{1..3}.ts')).toBe('src/(a|b)/([1-3]).ts')
  })

  it('should expand padded ranges', () => {
    expect(braces.expand('a/{01..03}/b')).toEqual(['a/01/b', 'a/02/b', 'a/03/b'])
  })

  it('should preserve upstream unpaired quote behavior', () => {
    expect(braces.expand('a"{b,c}')).toEqual(['a{b,c}'])
  })

  it('should preserve upstream malformed range behavior', () => {
    expect(braces.expand('{..a,b}')).toEqual(['{..a,b}'])
  })

  it('should preserve upstream stringify escaping for invalid containers', () => {
    const ast: AstNode = { type: 'brace', nodes: [{ type: 'open', value: '{' }] }
    expect(braces.stringify(ast, { escapeInvalid: true })).toBe('{')
  })

  it('should expand braces through the installed micromatch consumer', () => {
    const micromatch = tailwindRequire('micromatch')
    expect(micromatch.braceExpand('src/{a,b}.ts')).toEqual(['src/a.ts', 'src/b.ts'])
    expect(() => micromatch.braceExpand(nestedPattern(101))).toThrow(SyntaxError)
  })
})
