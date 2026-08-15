import { afterEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))
vi.mock('@/lib/server/secret-encryption', () => ({ decryptSecret: (value: string) => `decrypted:${value}` }))

import { fetchElevenLabsAccount, resolveElevenLabsTts, resolveValidatedElevenLabsTts } from './elevenlabs-account'

describe('ElevenLabs account resolution', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('requires every user to have a personal connection and selected voice', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(resolveElevenLabsTts('user-1', 'english')).resolves.toBeNull()
    expect(maybeSingle).toHaveBeenCalledOnce()
  })

  it('resolves each language from the user record', async () => {
    maybeSingle.mockResolvedValue({ data: {
      encrypted_api_key: 'personal-secret',
      english_voice_id: 'english-voice',
      czech_voice_id: 'czech-voice',
      turkish_voice_id: 'turkish-voice',
    }, error: null })

    await expect(resolveElevenLabsTts('user-1', 'turkish')).resolves.toEqual({
      apiKey: 'decrypted:personal-secret',
      config: { voiceId: 'turkish-voice', modelId: 'eleven_flash_v2_5', languageCode: 'tr' },
    })
  })

  it('filters malformed voices returned by the provider', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscription: { tier: 'creator' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [
        { voice_id: 'voice-1', name: 'Voice One', category: 'premade' },
        { voice_id: 42, name: 'Invalid' },
      ] }) }))

    await expect(fetchElevenLabsAccount('personal-secret')).resolves.toEqual({
      tier: 'creator', voices: [{ voice_id: 'voice-1', name: 'Voice One', category: 'premade' }],
    })
  })

  it('rejects a selected voice that is no longer available', async () => {
    maybeSingle.mockResolvedValue({ data: {
      encrypted_api_key: 'personal-secret', english_voice_id: 'missing-voice',
      czech_voice_id: null, turkish_voice_id: null,
    }, error: null })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ subscription: { tier: 'creator' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [{ voice_id: 'different-voice', name: 'Different Voice' }] }) }))

    await expect(resolveValidatedElevenLabsTts('user-1', 'english')).resolves.toBeNull()
  })
})
