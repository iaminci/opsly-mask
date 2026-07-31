import { getSubtleCrypto, KEY_LENGTH_BITS, PBKDF2_ITERATIONS, toBufferSource } from './utils.js'

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto()
  const encoder = new TextEncoder()

  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toBufferSource(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}
