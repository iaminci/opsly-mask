import { deriveKey } from './deriveKey.js'
import type { EncryptedDocument } from './types.js'
import { base64ToBytes, getSubtleCrypto, IV_LENGTH, SALT_LENGTH, toBufferSource } from './utils.js'

export function isEncryptedDocument(value: unknown): value is EncryptedDocument {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    obj.version === 1 &&
    obj.algorithm === 'AES-GCM' &&
    obj.kdf === 'PBKDF2' &&
    typeof obj.iterations === 'number' &&
    obj.iterations > 0 &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.ciphertext === 'string'
  )
}

function validateEncryptedDocument(value: unknown): asserts value is EncryptedDocument {
  if (!isEncryptedDocument(value)) {
    throw new Error(
      'Malformed encrypted document: missing or invalid required fields',
    )
  }

  if (value.version !== 1) {
    throw new Error(`Unsupported document version: ${value.version}`)
  }

  const salt = base64ToBytes(value.salt, 'salt')
  if (salt.length !== SALT_LENGTH) {
    throw new Error(`Invalid salt length: expected ${SALT_LENGTH} bytes`)
  }

  const iv = base64ToBytes(value.iv, 'iv')
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes`)
  }

  base64ToBytes(value.ciphertext, 'ciphertext')
}

export async function decryptDocument(
  encrypted: EncryptedDocument,
  passphrase: string,
): Promise<string> {
  validateEncryptedDocument(encrypted)

  const salt = base64ToBytes(encrypted.salt, 'salt')
  const iv = base64ToBytes(encrypted.iv, 'iv')
  const ciphertext = base64ToBytes(encrypted.ciphertext, 'ciphertext')

  const key = await deriveKey(passphrase, salt, encrypted.iterations)

  try {
    const plaintextBuffer = await getSubtleCrypto().decrypt(
      { name: 'AES-GCM', iv: toBufferSource(iv) },
      key,
      toBufferSource(ciphertext),
    )
    return new TextDecoder().decode(plaintextBuffer)
  } catch {
    throw new Error('Invalid passphrase or corrupted ciphertext')
  }
}
