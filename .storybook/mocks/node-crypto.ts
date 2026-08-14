function serverOnly(): never {
  throw new Error('Server-only cryptography is unavailable in Storybook')
}

export const createCipheriv = serverOnly
export const createDecipheriv = serverOnly
export const randomBytes = serverOnly
