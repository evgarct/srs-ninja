import { describe, expect, it } from 'vitest'

import { getAuthCallbackUrl, resolveAppOrigin } from './app-origin'

describe('application origin', () => {
  it('normalizes the configured production origin', () => {
    expect(resolveAppOrigin({ APP_URL: 'example.com/path', NODE_ENV: 'production' }))
      .toBe('https://example.com')
    expect(getAuthCallbackUrl({ APP_URL: 'https://example.com/', NODE_ENV: 'production' }))
      .toBe('https://example.com/auth/callback')
  })

  it('rejects missing or localhost production origins', () => {
    expect(() => resolveAppOrigin({ NODE_ENV: 'production' })).toThrow(
      'APP_URL must be configured in production'
    )
    expect(() => resolveAppOrigin({ APP_URL: 'http://localhost:3000', NODE_ENV: 'production' }))
      .toThrow('APP_URL must not use localhost in production')
    expect(() => resolveAppOrigin({ APP_URL: 'http://example.com', NODE_ENV: 'production' }))
      .toThrow('APP_URL must use HTTPS in production')
  })

  it('uses localhost only in development', () => {
    expect(getAuthCallbackUrl({ NODE_ENV: 'development' }))
      .toBe('http://localhost:3000/auth/callback')
  })
})
