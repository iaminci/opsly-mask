import { describe, expect, it } from 'vitest'
import {
  changePassphrase,
  decryptDocument,
  encryptDocument,
  isEncryptedDocument,
  type EncryptedDocument,
} from '../src/crypto/index.js'

const PASSPHRASE = 'correct-horse-battery-staple'

describe('encryptDocument / decryptDocument', () => {
  it('round-trips plaintext through encrypt and decrypt', async () => {
    const plaintext = '# Hello\n\nThis is a **secure** document.'
    const encrypted = await encryptDocument(plaintext, PASSPHRASE)

    expect(encrypted.version).toBe(1)
    expect(encrypted.algorithm).toBe('AES-GCM')
    expect(encrypted.kdf).toBe('PBKDF2')
    expect(encrypted.iterations).toBe(600_000)
    expect(typeof encrypted.salt).toBe('string')
    expect(typeof encrypted.iv).toBe('string')
    expect(typeof encrypted.ciphertext).toBe('string')

    const decrypted = await decryptDocument(encrypted, PASSPHRASE)
    expect(decrypted).toBe(plaintext)
  })

  it('rejects a wrong passphrase', async () => {
    const encrypted = await encryptDocument('secret content', PASSPHRASE)

    await expect(
      decryptDocument(encrypted, 'wrong-passphrase'),
    ).rejects.toThrow('Invalid passphrase or corrupted ciphertext')
  })

  it('handles an empty document', async () => {
    const encrypted = await encryptDocument('', PASSPHRASE)
    const decrypted = await decryptDocument(encrypted, PASSPHRASE)
    expect(decrypted).toBe('')
  })

  it('handles unicode content', async () => {
    const plaintext = '🔐 日本語 emoji — café naïve résumé'
    const encrypted = await encryptDocument(plaintext, PASSPHRASE)
    const decrypted = await decryptDocument(encrypted, PASSPHRASE)
    expect(decrypted).toBe(plaintext)
  })

  it(
    'handles a large markdown document (~1 MB)',
    async () => {
      const paragraph = '# Section\n\nLorem ipsum dolor sit amet.\n\n'
      const plaintext = paragraph.repeat(Math.ceil(1_000_000 / paragraph.length)).slice(
        0,
        1_000_000,
      )
      expect(plaintext.length).toBe(1_000_000)

      const encrypted = await encryptDocument(plaintext, PASSPHRASE)
      const decrypted = await decryptDocument(encrypted, PASSPHRASE)
      expect(decrypted).toBe(plaintext)
    },
    60_000,
  )
})

describe('isEncryptedDocument', () => {
  it('returns true for a valid encrypted document', async () => {
    const encrypted = await encryptDocument('test', PASSPHRASE)
    expect(isEncryptedDocument(encrypted)).toBe(true)
  })

  it('returns false for non-objects', () => {
    expect(isEncryptedDocument(null)).toBe(false)
    expect(isEncryptedDocument(undefined)).toBe(false)
    expect(isEncryptedDocument('string')).toBe(false)
    expect(isEncryptedDocument(42)).toBe(false)
  })

  it('returns false for objects missing required fields', () => {
    expect(isEncryptedDocument({})).toBe(false)
    expect(isEncryptedDocument({ version: 1 })).toBe(false)
    expect(
      isEncryptedDocument({
        version: 1,
        algorithm: 'AES-GCM',
        kdf: 'PBKDF2',
        iterations: 600_000,
        salt: 'abc',
        iv: 'def',
      }),
    ).toBe(false)
  })

  it('returns false for unsupported algorithm or kdf', () => {
    expect(
      isEncryptedDocument({
        version: 1,
        algorithm: 'AES-CBC',
        kdf: 'PBKDF2',
        iterations: 600_000,
        salt: 'abc',
        iv: 'def',
        ciphertext: 'ghi',
      }),
    ).toBe(false)
  })
})

describe('decryptDocument validation', () => {
  it('rejects a malformed payload with missing fields', async () => {
    await expect(
      decryptDocument({} as EncryptedDocument, PASSPHRASE),
    ).rejects.toThrow('Malformed encrypted document')
  })

  it('rejects an unsupported version', async () => {
    const encrypted = await encryptDocument('test', PASSPHRASE)
    const tampered = { ...encrypted, version: 99 }

    await expect(decryptDocument(tampered, PASSPHRASE)).rejects.toThrow(
      'Malformed encrypted document',
    )
  })

  it('rejects invalid base64 in salt', async () => {
    const encrypted = await encryptDocument('test', PASSPHRASE)
    const tampered = { ...encrypted, salt: '!!!not-base64!!!' }

    await expect(decryptDocument(tampered, PASSPHRASE)).rejects.toThrow(
      'Invalid base64 encoding for salt',
    )
  })

  it('rejects a salt with incorrect length', async () => {
    const encrypted = await encryptDocument('test', PASSPHRASE)
    const tampered = { ...encrypted, salt: btoa('short') }

    await expect(decryptDocument(tampered, PASSPHRASE)).rejects.toThrow(
      'Invalid salt length',
    )
  })

  it('rejects an IV with incorrect length', async () => {
    const encrypted = await encryptDocument('test', PASSPHRASE)
    const tampered = { ...encrypted, iv: btoa('too-short') }

    await expect(decryptDocument(tampered, PASSPHRASE)).rejects.toThrow(
      'Invalid IV length',
    )
  })
})

describe('changePassphrase', () => {
  it('re-encrypts with a new passphrase', async () => {
    const plaintext = 'sensitive notes'
    const oldPassphrase = 'old-secret'
    const newPassphrase = 'new-secret'

    const encrypted = await encryptDocument(plaintext, oldPassphrase)
    const reEncrypted = await changePassphrase(
      encrypted,
      oldPassphrase,
      newPassphrase,
    )

    expect(isEncryptedDocument(reEncrypted)).toBe(true)
    expect(reEncrypted.ciphertext).not.toBe(encrypted.ciphertext)

    await expect(decryptDocument(encrypted, newPassphrase)).rejects.toThrow(
      'Invalid passphrase or corrupted ciphertext',
    )

    const decrypted = await decryptDocument(reEncrypted, newPassphrase)
    expect(decrypted).toBe(plaintext)
  })

  it('rejects when the old passphrase is wrong', async () => {
    const encrypted = await encryptDocument('data', 'real-passphrase')

    await expect(
      changePassphrase(encrypted, 'wrong-passphrase', 'new-passphrase'),
    ).rejects.toThrow('Invalid passphrase or corrupted ciphertext')
  })
})
