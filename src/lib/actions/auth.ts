'use server'

import { getAuthCallbackUrl } from '@/lib/app-origin'

export async function getConfiguredAuthCallbackUrl() {
  return getAuthCallbackUrl()
}
