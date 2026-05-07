import type { Literal } from 'mdast'

/**
 * Custom mdast node produced from fenced `secure` code blocks.
 * Kept separate from `code` so downstream processors can treat secrets
 * differently (masking, redaction, encryption hooks, etc.).
 */
export interface SecureFence extends Literal {
  type: 'secureFence'
}

export function isSecureFence(node: unknown): node is SecureFence {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    (node as SecureFence).type === 'secureFence'
  )
}

declare module 'mdast' {
  interface RootContentMap {
    secureFence: SecureFence
  }
}
