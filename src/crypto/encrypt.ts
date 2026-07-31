import { deriveKey } from './deriveKey.js'
import type { EncryptedDocument } from './types.js'
import {
  bytesToBase64,
  getRandomBytes,
  getSubtleCrypto,
  IV_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  toBufferSource,
} from './utils.js'

export async function encryptDocument(
  plaintext: string,
  passphrase: string,
): Promise<EncryptedDocument> {
  const salt = getRandomBytes(SALT_LENGTH)
  const iv = getRandomBytes(IV_LENGTH)
  const key = await deriveKey(passphrase, salt)

  const encoder = new TextEncoder()
  const ciphertextBuffer = await getSubtleCrypto().encrypt(
    { name: 'AES-GCM', iv: toBufferSource(iv) },
    key,
    encoder.encode(plaintext),
  )

  return {
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
  }
}
