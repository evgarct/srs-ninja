import { afterEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))

import { fetchElevenLabsAccount, resolveElevenLabsTts } from './elevenlabs-account'

describe('ElevenLabs account resolution', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('uses the platform connection only for the configured owner', async () => {
    vi.stubEnv('ELEVENLABS_OWNER_USER_ID', 'owner-id')
    vi.stubEnv('ELEVENLABS_API_KEY', 'owner-secret')

    await expect(resolveElevenLabsTts('owner-id', 'english')).resolves.toMatchObject({
      apiKey: 'owner-secret',
      config: { languageCode: 'en' },
    })
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('never falls back to the platform connection for another user', async () => {
    vi.stubEnv('ELEVENLABS_OWNER_USER_ID', 'owner-id')
    vi.stubEnv('ELEVENLABS_API_KEY', 'owner-secret')
    maybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(resolveElevenLabsTts('another-user', 'english')).resolves.toBeNull()
    expect(maybeSingle).toHaveBeenCalledOnce()
  })

  it('filters malformed voices returned by the provider', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscription: { tier: 'creator' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [
        { voice_id: 'voice-1', name: 'Voice One' },
        { voice_id: 42, name: 'Invalid' },
      ] }) }))

    await expect(fetchElevenLabsAccount('personal-secret')).resolves.toEqual({
      tier: 'creator',
      voices: [{ voice_id: 'voice-1', name: 'Voice One' }],
    })
  })
})
