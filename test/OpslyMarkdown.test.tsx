import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  OPSLY_MASK_TOGGLE_ATTR,
  useSecureFenceBehavior,
} from '../src/SecureBlock.js'
import { OpslyMarkdown } from '../src/OpslyMarkdown.js'

type PreAttrs = ComponentProps<'pre'> & {
  'data-opsly-mask'?: unknown
}

function MarkdownPre(props: PreAttrs) {
  const b = useSecureFenceBehavior()

  return createElement(
    'pre',
    props,
    props['data-opsly-mask'] != null &&
      props['data-opsly-mask'] !== false &&
      b != null
      ? createElement(
          'button',
          {
            type: 'button',
            [OPSLY_MASK_TOGGLE_ATTR]: true,
            'aria-pressed': b.revealed,
            'aria-controls': b.contentId,
            onClick: b.toggle,
          },
          'Toggle',
        )
      : null,
    props.children,
  )
}

describe('OpslyMarkdown rendering', () => {
  it('emits secure host markup for ```secure without metadata (no built-in toggle)', () => {
    const md = '```secure\nSECRET=value\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).toContain('data-opsly-mask')
    expect(html).toContain('data-opsly-mask-content')
    expect(html).not.toContain('data-opsly-mask-toggle')
  })

  it('lets consumers add a toggle via `components.pre` + useSecureFenceBehavior', () => {
    const md = '```secure\nSECRET=value\n```'
    const html = renderToStaticMarkup(
      createElement(OpslyMarkdown, {
        children: md,
        components: { pre: MarkdownPre },
      }),
    )
    expect(html).toContain('data-opsly-mask-toggle')
    expect(html).toContain('Toggle')
    expect(html).toMatch(/aria-controls="[^"]+"/)
    expect(html).toMatch(/id="[^"]+mask-content"/)
  })

  it('emits secure host markup for ```secure with metadata', () => {
    const md = '```secure id="example"\nSECRET=value\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).toContain('data-opsly-mask')
  })

  it('treats ```secure id="prod" as a secure fence', () => {
    const md = '```secure id="prod"\nSECRET=value\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).toContain('data-opsly-mask')
    expect(html).toContain('data-revealed="false"')
    expect(html).toContain('language-secure')
    expect(html).toMatch(/id="[^"]+mask-content"/)
  })

  it('does not wrap normal fences in secure host', () => {
    const md = '```javascript\nconst x = 1\n```'
    const html = renderToStaticMarkup(createElement(OpslyMarkdown, { children: md }))
    expect(html).not.toContain('data-opsly-mask-toggle')
    expect(html).not.toContain('data-opsly-mask')
    expect(html).not.toContain('language-secure')
    expect(html).toContain('language-javascript')
  })
})
