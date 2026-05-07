import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import type { SecureFence } from '../mdast/secureFence.js'

/**
 * Rewrites ```secure fenced blocks into mdast `secureFence` nodes.
 * Runs in the remark (mdast) phase so all later plugins see an explicit AST type
 * instead of inferring from `code.lang`.
 */
export const remarkSecureFence: Plugin<[], Root> = function remarkSecureFence() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'secure' || parent == null || index === undefined) {
        return
      }

      const next: SecureFence = {
        type: 'secureFence',
        value: node.value,
      }

      parent.children[index] = next
    })
  }
}
