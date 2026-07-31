export { changePassphrase } from './changePassphrase.js'
export { decryptDocument, isEncryptedDocument } from './decrypt.js'
export { deriveKey } from './deriveKey.js'
export { encryptDocument } from './encrypt.js'
export type { EncryptedDocument } from './types.js'
export {
  bytesToBase64,
  base64ToBytes,
  getRandomBytes,
  getSubtleCrypto,
  IV_LENGTH,
  KEY_LENGTH_BITS,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
} from './utils.js'
