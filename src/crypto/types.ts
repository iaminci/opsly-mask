export interface EncryptedDocument {
  version: number
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}
