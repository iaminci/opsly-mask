import type { Code, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import type { SecureFence } from '../mdast/secureFence.js'

function normalizeLanguageToken(value: string): string {
  return value.trim().replace(/\r$/, '').split(/\s+/)[0] ?? ''
}

/**
 * Primary fenced language from mdast (`code.lang`), optional metadata ignored.
 * Falls back to the first token of `meta` only when `lang` is missing — some
 * pipelines surface the whole info string there.
 */
export function fenceLanguage(node: Code): string {
  if (typeof node.lang === 'string' && node.lang.trim() !== '') {
    return normalizeLanguageToken(node.lang)
  }
  if (typeof node.meta === 'string' && node.meta.trim() !== '') {
    return normalizeLanguageToken(node.meta)
  }
  return ''
}

/** True when the fenced block language is `secure`; metadata is ignored. */
export function isSecureFenceCode(node: Code): boolean {
  return fenceLanguage(node) === 'secure'
}

/**
 * Rewrites ```secure fenced blocks into mdast `secureFence` nodes.
 * Runs in the remark (mdast) phase so all later plugins see an explicit AST type
 * instead of inferring from `code.lang`.
 */
export const remarkSecureFence: Plugin<[], Root> = function remarkSecureFence() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (!isSecureFenceCode(node) || parent == null || index === undefined) {
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
