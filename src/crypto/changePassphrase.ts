import { decryptDocument } from './decrypt.js'
import { encryptDocument } from './encrypt.js'
import type { EncryptedDocument } from './types.js'

export async function changePassphrase(
  encrypted: EncryptedDocument,
  oldPassphrase: string,
  newPassphrase: string,
): Promise<EncryptedDocument> {
  const plaintext = await decryptDocument(encrypted, oldPassphrase)
  return encryptDocument(plaintext, newPassphrase)
}
