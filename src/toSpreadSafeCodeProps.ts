import type { ComponentProps } from 'react'
import type { ExtraProps } from 'react-markdown'

export type MarkdownCodeProps = ComponentProps<'code'> &
  ExtraProps & {
    inline?: boolean | undefined
  }

/**
 * react-markdown passes `inline` and `node`; they must not reach DOM `<code>`.
 * Custom renderers often use `<code {...props} />` — making these keys
 * non-enumerable omits them from object spread while `props.inline` and
 * `props.node` remain available for branching / plugins.
 */
export function toSpreadSafeCodeProps(
  props: MarkdownCodeProps,
): MarkdownCodeProps {
  const { inline, node, className, children, ...rest } = props
  const bag = {
    ...rest,
    className,
    children,
  } as MarkdownCodeProps

  Object.defineProperty(bag, 'inline', {
    value: inline,
    enumerable: false,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(bag, 'node', {
    value: node,
    enumerable: false,
    configurable: true,
    writable: true,
  })

  return bag as MarkdownCodeProps
}
