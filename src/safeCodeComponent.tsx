import { createElement, type ComponentType } from 'react'
import type { Components } from 'react-markdown'
import { SecureBlock, type SecureBlockOptions } from './SecureBlock.js'
import {
  type MarkdownCodeProps,
  toSpreadSafeCodeProps,
} from './toSpreadSafeCodeProps.js'

const LANGUAGE_SECURE_RE = /\blanguage-secure\b/

/**
 * `react-markdown` code renderer that never puts `inline` / `node` on DOM nodes:
 * default / intrinsic paths follow the usual branch; custom functions receive
 * spread-safe props so `{...props}` onto `<code>` stays valid.
 *
 * Fenced blocks that still reach the renderer as `code` with `language-secure`
 * (for example when remark transformers are not run on the tree) are wrapped in
 * {@link SecureBlock} so the mask/reveal behavior still applies.
 *
 * @param secureBlockOptions Optional props for fallback `language-secure` fences (e.g. `groupLabel`); no UI bundled.
 */
export function createSafeCodeComponent(
  userCode: Components['code'] | undefined,
  userPre?: Components['pre'],
  secureBlockOptions?: SecureBlockOptions,
): NonNullable<Components['code']> {
  return function SafeCode(props: MarkdownCodeProps) {
    const { inline, className, children, node: _node, ...rest } = props
    const maskContent = (props as Record<string, unknown>)[
      'data-opsly-mask-content'
    ]
    const isOuterSecureLanguageFence =
      !inline &&
      typeof className === 'string' &&
      LANGUAGE_SECURE_RE.test(className) &&
      maskContent == null

    if (isOuterSecureLanguageFence) {
      return (
        <SecureBlock
          pre={userPre}
          code={userCode ?? 'code'}
          {...secureBlockOptions}
        >
          {children}
        </SecureBlock>
      )
    }

    if (!userCode || userCode === 'code') {
      if (inline) {
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        )
      }
      return (
        <pre>
          <code className={className} {...rest}>
            {children}
          </code>
        </pre>
      )
    }

    if (typeof userCode === 'string') {
      const Tag = userCode
      if (inline) {
        return createElement(Tag, { className, ...rest }, children)
      }
      return createElement(
        'pre',
        {},
        createElement(Tag, { className, ...rest }, children),
      )
    }

    const User = userCode as ComponentType<MarkdownCodeProps>
    return createElement(User, toSpreadSafeCodeProps(props))
  }
}
