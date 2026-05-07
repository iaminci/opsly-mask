import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  useId,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { Components } from 'react-markdown'
import {
  type MarkdownCodeProps,
  toSpreadSafeCodeProps,
} from './toSpreadSafeCodeProps.js'

/**
 * Recommended DOM attribute for the app-provided reveal/mask focusable control
 * (`[data-opsly-mask-toggle]` in CSS selectors). Not emitted by the package.
 */
export const OPSLY_MASK_TOGGLE_ATTR = 'data-opsly-mask-toggle'

/**
 * Fixed-length mask; does not reflect secret length.
 * Inline within the same `code` surface as revealed content.
 */
const MASK_DISPLAY = '•'.repeat(16)

/** Fenced-block language token; pair with your existing `language-*` / Shiki rules. */
const SECURE_LANG_CLASS = 'language-secure'

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

type Extra = import('react-markdown').ExtraProps
type PreProps = ComponentProps<'pre'> &
  Extra & {
    'data-opsly-mask'?: boolean | string | undefined
    'data-revealed'?: 'true' | 'false' | undefined
  }
type CodeProps = MarkdownCodeProps & {
  'data-opsly-mask-content'?: boolean | string | undefined
}

/**
 * Reveal behavior for one secure fence instance. Use from your `components.pre`
 * (or descendants) inside `SecureBlock` via {@link useSecureFenceBehavior}.
 */
export type SecureFenceBehavior = Readonly<{
  /** Literal secret visible (vs fixed-length mask). */
  revealed: boolean
  setRevealed: Dispatch<SetStateAction<boolean>>
  toggle: () => void
  /** `id` of the fenced `<code>` — pair with `aria-controls` on your toggle. */
  contentId: string
  /** `id` on the visually hidden group name span (`aria-labelledby` on `pre`). */
  groupLabelId: string
}>

const SecureFenceBehaviorContext = createContext<SecureFenceBehavior | null>(
  null,
)

/**
 * Subscribe to reveal state / handlers for the innermost surrounding secure fence.
 * Returns `null` outside `SecureBlock` (including normal fenced `pre`).
 */
export function useSecureFenceBehavior(): SecureFenceBehavior | null {
  return useContext(SecureFenceBehaviorContext)
}

type ExtraChildProps = Omit<SecureBlockProps, 'pre' | 'code' | 'children'>

export type SecureBlockProps = {
  children?: ReactNode
  /**
   * Same `components.pre` you pass to `react-markdown`, so secure fences reuse
   * your code-block wrapper (padding, radius, background, scroll, etc.).
   */
  pre?: Components['pre']
  /**
   * Same `components.code` you pass to `react-markdown`, for typography and
   * highlighter shells that target `code` / `language-*`.
   */
  code?: Components['code']
  /**
   * Accessible name fragment for `role="group"` (`aria-labelledby`). Not a toggle.
   */
  groupLabel?: string
}

/** Options passed through markdown helpers (everything except pipeline `pre` / `code` / fence `children`). */
export type SecureBlockOptions = ExtraChildProps

function renderPre(
  P: Components['pre'] | undefined,
  props: PreProps,
  children: ReactNode,
) {
  const Impl = P ?? 'pre'
  if (typeof Impl === 'string') {
    return createElement(Impl, props, children)
  }
  const Comp = Impl as ComponentType<PreProps>
  return <Comp {...props}>{children}</Comp>
}

function renderCode(C: Components['code'] | undefined, props: CodeProps) {
  const { inline: _inline, node: _node, ...domOnly } = props
  const Impl = C ?? 'code'
  if (typeof Impl === 'string') {
    return createElement(Impl, domOnly, props.children)
  }
  const Comp = Impl as ComponentType<MarkdownCodeProps>
  return createElement(Comp, toSpreadSafeCodeProps(props))
}

function normalizeSecretText(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(normalizeSecretText).join('')
  }
  return ''
}

const DEFAULT_GROUP_LABEL = 'Protected content'

/**
 * Native `pre` / `code` fence: mask and reveal live on the same code surface;
 * the revealed payload is literal text (whitespace-preserving), not prose markdown.
 *
 * The package renders **no** reveal control. Use {@link useSecureFenceBehavior}
 * from your `components.pre` to attach buttons, toolbar actions, keyboard
 * shortcuts, etc.
 */
export function SecureBlock(props: SecureBlockProps) {
  const { children, pre: PreComponent, code: CodeComponent, groupLabel } =
    props
  const resolvedGroupLabel = groupLabel ?? DEFAULT_GROUP_LABEL
  const baseId = useId()
  const labelId = `${baseId}-label`
  const contentId = `${baseId}-mask-content`
  const [revealed, setRevealed] = useState(false)

  const secretText = useMemo(() => normalizeSecretText(children), [children])

  const behavior = useMemo(
    (): SecureFenceBehavior => ({
      revealed,
      setRevealed,
      toggle: () => setRevealed((v) => !v),
      contentId,
      groupLabelId: labelId,
    }),
    [revealed, setRevealed, contentId, labelId],
  )

  const preProps: PreProps = {
    'data-opsly-mask': true,
    'data-revealed': revealed ? 'true' : 'false',
    role: 'group',
    'aria-labelledby': labelId,
  }

  const codeChildren = revealed ? secretText : MASK_DISPLAY

  const codeProps: CodeProps = {
    id: contentId,
    className: SECURE_LANG_CLASS,
    'data-opsly-mask-content': true,
    children: codeChildren,
    ...(!revealed ? { 'aria-hidden': true as const } : {}),
  }

  const inner = (
    <>
      <span id={labelId} style={visuallyHidden}>
        {resolvedGroupLabel}
      </span>
      {renderCode(CodeComponent, codeProps)}
    </>
  )

  return (
    <SecureFenceBehaviorContext.Provider value={behavior}>
      {renderPre(PreComponent, preProps, inner)}
    </SecureFenceBehaviorContext.Provider>
  )
}
