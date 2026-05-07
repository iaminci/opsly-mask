import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OpslyMarkdown } from '../src/OpslyMarkdown.js'

describe('OpslyMarkdown rendering', () => {
  it('emits secure host markup for ```secure without metadata', () => {
    const md = '```secure\nSECRET=value\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).toContain('data-opsly-mask')
    expect(html).toContain('data-opsly-mask-toggle')
  })

  it('emits secure host markup for ```secure with metadata', () => {
    const md = '```secure id="example"\nSECRET=value\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).toContain('data-opsly-mask')
  })

  it('does not wrap normal fences in secure host', () => {
    const md = '```javascript\nconst x = 1\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).not.toContain('data-opsly-mask-toggle')
    expect(html).toContain('language-javascript')
  })
})
