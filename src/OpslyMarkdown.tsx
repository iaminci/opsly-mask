import {
  createElement,
  type ComponentType,
  type HTMLAttributes,
  type ReactElement,
} from 'react'
import Markdown, { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Options as RemarkRehypeOptions } from 'remark-rehype'
import { SecureBlock } from './SecureBlock.js'
import {
  OPSLY_MASK_DATA_ATTR,
  secureFenceHandlers,
} from './remark/secureFenceHastHandler.js'
import { remarkSecureFence } from './remark/remarkSecureFence.js'
import { createSafeCodeComponent } from './safeCodeComponent.js'

/** Default remark ordering: GFM first, then secure fence normalization. */
export const opslyMaskRemarkPlugins = [remarkGfm, remarkSecureFence]

/**
 * Handlers passed to `remark-rehype` (`remarkRehypeOptions`) so `secureFence`
 * mdast nodes become dedicated hast subtrees for `SecureBlock`.
 */
export function opslyMaskRemarkRehypeOptions(): Readonly<RemarkRehypeOptions> {
  return {
    handlers: secureFenceHandlers as unknown as NonNullable<
      RemarkRehypeOptions['handlers']
    >,
  }
}

type DivProps = HTMLAttributes<HTMLDivElement> &
  import('react-markdown').ExtraProps

function isSecureFenceHostDiv(props: DivProps): boolean {
  const p = props as Record<string, unknown>
  const camel = p.dataOpslyMask
  const hyphen = p[OPSLY_MASK_DATA_ATTR]
  const set = (v: unknown) =>
    v !== undefined && v !== false && v !== null
  return set(camel) || set(hyphen)
}

/**
 * Merges user `components` with the secure-fence `div` → `SecureBlock` mapping.
 * Forwards the same `pre` / `code` implementations into `SecureBlock` so styling
 * matches normal fenced blocks.
 */
export function createOpslyMarkdownComponents(
  base: Components | null | undefined,
): Components {
  const userDiv = base?.div
  const userPre = base?.pre
  const rawCode = base?.code
  const safeCode = createSafeCodeComponent(rawCode, userPre)

  return {
    ...(base ?? {}),
    code: safeCode,
    div(props: DivProps): ReactElement {
      const { className, children, ...rest } = props

      if (isSecureFenceHostDiv(props)) {
        return (
          <SecureBlock pre={userPre} code={safeCode}>
            {children}
          </SecureBlock>
        )
      }

      if (typeof userDiv === 'function') {
        const Comp = userDiv as ComponentType<DivProps>
        return (
          <Comp className={className} {...rest}>
            {children}
          </Comp>
        )
      }

      if (typeof userDiv === 'string') {
        return createElement(userDiv, { className, ...rest }, children)
      }

      return (
        <div className={className} {...rest}>
          {children}
        </div>
      )
    },
  }
}

export type OpslyMarkdownProps = Omit<
  Options,
  'remarkPlugins' | 'remarkRehypeOptions' | 'components'
> & {
  components?: Components
}

/**
 * Opinionated `react-markdown` wrapper: GFM + secure fences + semantic host markup.
 * Visual styling is owned by the application (see README).
 */
export function OpslyMarkdown(props: OpslyMarkdownProps) {
  const { components, ...rest } = props

  return (
    <Markdown
      remarkPlugins={[...opslyMaskRemarkPlugins]}
      remarkRehypeOptions={opslyMaskRemarkRehypeOptions()}
      components={createOpslyMarkdownComponents(components)}
      {...rest}
    />
  )
}
