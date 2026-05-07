import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useId, useMemo, useState } from 'react'
import type { Components } from 'react-markdown'
import { Eye, EyeOff } from 'lucide-react'
import {
  type MarkdownCodeProps,
  toSpreadSafeCodeProps,
} from './toSpreadSafeCodeProps.js'

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

/** Subtle icon: smaller stroke so the control stays secondary to the code surface. */
const iconSize: CSSProperties = {
  width: '0.75em',
  height: '0.75em',
  display: 'block',
}

/**
 * Corner affordance only — layout/semantics; chrome (opacity, color) in app CSS.
 */
const togglePosition: CSSProperties = {
  position: 'absolute',
  top: '0.5em',
  right: '0.5em',
  zIndex: 1,
  padding: '0.15em',
  margin: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  lineHeight: 1,
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
}

/**
 * Native `pre` / `code` fence: mask and reveal are the same code surface;
 * revealed payload is literal text (whitespace-preserving), not prose markdown.
 */
export function SecureBlock(props: SecureBlockProps) {
  const { children, pre: PreComponent, code: CodeComponent } = props
  const baseId = useId()
  const labelId = `${baseId}-label`
  const [revealed, setRevealed] = useState(false)

  const secretText = useMemo(() => normalizeSecretText(children), [children])

  const toggle = () => setRevealed((v) => !v)

  const preProps: PreProps = {
    'data-opsly-mask': true,
    'data-revealed': revealed ? 'true' : 'false',
    role: 'group',
    'aria-labelledby': labelId,
    style: { position: 'relative' },
  }

  const codeChildren = revealed ? secretText : MASK_DISPLAY

  const codeProps: CodeProps = {
    className: SECURE_LANG_CLASS,
    'data-opsly-mask-content': true,
    children: codeChildren,
    ...(!revealed ? { 'aria-hidden': true as const } : {}),
  }

  return renderPre(
    PreComponent,
    preProps,
    <>
      <span id={labelId} style={visuallyHidden}>
        Protected content
      </span>
      <button
        type="button"
        data-opsly-mask-toggle
        onClick={toggle}
        aria-pressed={revealed}
        aria-label={
          revealed ? 'Hide protected content' : 'Show protected content'
        }
        style={togglePosition}
      >
        {revealed ? (
          <EyeOff style={iconSize} strokeWidth={1.5} aria-hidden />
        ) : (
          <Eye style={iconSize} strokeWidth={1.5} aria-hidden />
        )}
      </button>
      {renderCode(CodeComponent, codeProps)}
    </>,
  )
}
