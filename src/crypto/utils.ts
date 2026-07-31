/** Default PBKDF2 iteration count for key derivation. */
export const PBKDF2_ITERATIONS = 600_000

/** Salt length in bytes for PBKDF2. */
export const SALT_LENGTH = 16

/** IV length in bytes for AES-GCM. */
export const IV_LENGTH = 12

/** AES key length in bits. */
export const KEY_LENGTH_BITS = 256

export function getSubtleCrypto(): SubtleCrypto {
  const crypto = globalThis.crypto
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment')
  }
  return crypto.subtle
}

export function getRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

/** Copy bytes into a dedicated ArrayBuffer for Web Crypto BufferSource typing. */
export function toBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export function base64ToBytes(base64: string, fieldName = 'value'): Uint8Array<ArrayBuffer> {
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error(`Invalid base64 encoding for ${fieldName}: expected non-empty string`)
  }

  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    throw new Error(`Invalid base64 encoding for ${fieldName}`)
  }
}
