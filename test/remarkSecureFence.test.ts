import { describe, expect, it } from 'vitest'
import type { Code } from 'mdast'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import {
  fenceLanguage,
  isSecureFenceCode,
  remarkSecureFence,
} from '../src/remark/remarkSecureFence.js'

/**
 * `unified#parse` only builds mdast — it does not run remark transforms.
 * This matches react-markdown (`parse` then `run`).
 */
async function runWithOpsly(md: string) {
  const proc = unified().use(remarkParse).use(remarkGfm).use(remarkSecureFence)
  return proc.run(proc.parse(md))
}

async function collectSecureFences(md: string): Promise<string[]> {
  const tree = await runWithOpsly(md)
  const values: string[] = []
  visit(tree, 'secureFence', (node) => {
    values.push(node.value)
  })
  return values
}

async function codeBlocks(md: string): Promise<Code[]> {
  const tree = await runWithOpsly(md)
  const out: Code[] = []
  visit(tree, 'code', (node) => {
    out.push(node)
  })
  return out
}

describe('fenceLanguage / isSecureFenceCode', () => {
  it('uses code.lang === "secure" (metadata optional)', () => {
    const plain: Code = {
      type: 'code',
      value: 'x',
      lang: 'secure',
      meta: null,
    }
    expect(fenceLanguage(plain)).toBe('secure')
    expect(isSecureFenceCode(plain)).toBe(true)
  })

  it('keeps language "secure" when meta has attributes', () => {
    const node: Code = {
      type: 'code',
      value: 'x',
      lang: 'secure',
      meta: 'id="example"',
    }
    expect(fenceLanguage(node)).toBe('secure')
    expect(isSecureFenceCode(node)).toBe(true)
  })

  it('treats empty meta like plain secure', () => {
    const node: Code = {
      type: 'code',
      value: 'x',
      lang: 'secure',
      meta: '',
    }
    expect(fenceLanguage(node)).toBe('secure')
    expect(isSecureFenceCode(node)).toBe(true)
  })

  it('falls back to meta first token only when lang is absent', () => {
    const node: Code = {
      type: 'code',
      value: 'x',
      lang: null,
      meta: 'secure',
    }
    expect(fenceLanguage(node)).toBe('secure')
    expect(isSecureFenceCode(node)).toBe(true)
  })

  it('normalizes stray CR on lang', () => {
    const node: Code = {
      type: 'code',
      value: 'x',
      lang: 'secure\r',
    }
    expect(isSecureFenceCode(node)).toBe(true)
  })

  it('does not match other fences', () => {
    expect(
      isSecureFenceCode({ type: 'code', value: '', lang: 'javascript' }),
    ).toBe(false)
    expect(
      isSecureFenceCode({ type: 'code', value: '', lang: 'secured' }),
    ).toBe(false)
    expect(
      isSecureFenceCode({ type: 'code', value: '', lang: 'mysecure' }),
    ).toBe(false)
  })
})

describe('remarkSecureFence', () => {
  it('rewrites plain ```secure fence', async () => {
    const md = '```secure\nSECRET=value\n```'
    expect(await collectSecureFences(md)).toEqual(['SECRET=value'])
    expect(await codeBlocks(md)).toHaveLength(0)
  })

  it('rewrites plain ```secure when the source uses CRLF newlines', async () => {
    const md = '```secure\r\nSECRET=value\r\n```'
    expect(await collectSecureFences(md)).toEqual(['SECRET=value'])
  })

  it('rewrites ```secure with metadata', async () => {
    const md = '```secure id="example"\nSECRET=value\n```'
    expect(await collectSecureFences(md)).toEqual(['SECRET=value'])
  })

  it('preserves multiline body', async () => {
    const md = '```secure\nline1\nline2\n\nline4\n```'
    expect(await collectSecureFences(md)).toEqual(['line1\nline2\n\nline4'])
  })

  it('leaves normal code fences as code nodes', async () => {
    const md = '```javascript\nconst x = 1\n```'
    const codes = await codeBlocks(md)
    expect(codes).toHaveLength(1)
    expect(codes[0].lang).toBe('javascript')
    expect(await collectSecureFences(md)).toHaveLength(0)
  })
})
