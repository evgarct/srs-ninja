type AppOriginEnvironment = {
  APP_URL?: string
  NODE_ENV?: string
}

export function resolveAppOrigin(environment: AppOriginEnvironment = process.env) {
  const configuredOrigin = environment.APP_URL?.trim()

  if (!configuredOrigin) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('APP_URL must be configured in production')
    }
    return 'http://localhost:3000'
  }

  const hasHttpScheme = /^https?:\/\//i.test(configuredOrigin)
  const url = new URL(hasHttpScheme ? configuredOrigin : `https://${configuredOrigin}`)
  if (environment.NODE_ENV === 'production' && ['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('APP_URL must not use localhost in production')
  }
  if (environment.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('APP_URL must use HTTPS in production')
  }

  return url.origin
}

export function getAuthCallbackUrl(environment: AppOriginEnvironment = process.env) {
  return `${resolveAppOrigin(environment)}/auth/callback`
}
