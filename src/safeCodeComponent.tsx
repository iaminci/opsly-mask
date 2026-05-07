import { createElement, type ComponentType } from 'react'
import type { Components } from 'react-markdown'
import {
  type MarkdownCodeProps,
  toSpreadSafeCodeProps,
} from './toSpreadSafeCodeProps.js'

/**
 * `react-markdown` code renderer that never puts `inline` / `node` on DOM nodes:
 * default / intrinsic paths follow the usual branch; custom functions receive
 * spread-safe props so `{...props}` onto `<code>` stays valid.
 */
export function createSafeCodeComponent(
  userCode: Components['code'] | undefined,
): NonNullable<Components['code']> {
  return function SafeCode(props: MarkdownCodeProps) {
    const { inline, className, children, node, ...rest } = props

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
