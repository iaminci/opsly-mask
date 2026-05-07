import type { Element } from 'hast'
import type { State } from 'mdast-util-to-hast'
import type { SecureFence } from '../mdast/secureFence.js'

/**
 * Host marker for secure-fence hast nodes (`<div data-opsly-mask>`).
 * Use in CSS as `[data-opsly-mask]` or match this string when debugging AST output.
 */
export const OPSLY_MASK_DATA_ATTR = 'data-opsly-mask'

/**
 * mdast → hast bridge for `secureFence` nodes.
 * Emits a single wrapper with text content so the React runtime passes the
 * literal string to `SecureBlock` (no HTML parsing of the fence body).
 */
export function secureFenceHandler(state: State, node: SecureFence): Element {
  const result: Element = {
    type: 'element',
    tagName: 'div',
    properties: {
      // hast / react-markdown: maps to the `data-opsly-mask` DOM attribute.
      dataOpslyMask: '',
    },
    children: [{ type: 'text', value: node.value }],
  }

  state.patch(node, result)
  return state.applyData(node, result)
}

export const secureFenceHandlers = {
  secureFence: secureFenceHandler,
}
