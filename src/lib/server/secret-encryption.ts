import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function getEncryptionKey() {
  const encoded = process.env.USER_CREDENTIALS_ENCRYPTION_KEY?.trim()
  if (!encoded) throw new Error('USER_CREDENTIALS_ENCRYPTION_KEY is not configured')
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) throw new Error('USER_CREDENTIALS_ENCRYPTION_KEY must contain 32 bytes')
  return key
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptSecret(payload: string) {
  const [version, iv, tag, ciphertext] = payload.split(':')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Invalid encrypted secret')
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8')
}
