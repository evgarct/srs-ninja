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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ tier: 'creator' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [
        { voice_id: 'voice-1', name: 'Voice One', category: 'premade', labels: { accent: 'neutral', invalid: 1 }, available_for_tiers: ['free'], verified_languages: [{ language: 'en', locale: 'en-US' }] },
        { voice_id: 42, name: 'Invalid' },
      ], has_more: false }) }))

    await expect(fetchElevenLabsAccount('personal-secret')).resolves.toEqual({
      tier: 'creator', voices: [{ voice_id: 'voice-1', name: 'Voice One', category: 'premade', labels: { accent: 'neutral' }, available_for_tiers: ['free'], verified_languages: [{ language: 'en', locale: 'en-US' }] }],
    })
  })

  it('loads every v2 voices page available to the authenticated account', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ tier: 'free' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [{ voice_id: 'first', name: 'First' }], has_more: true, next_page_token: 'page-2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [{ voice_id: 'second', name: 'Second' }], has_more: false }) })
    vi.stubGlobal('fetch', fetchMock)

    const account = await fetchElevenLabsAccount('personal-secret')
    expect(account.tier).toBe('free')
    expect(account.voices.map((voice) => voice.voice_id)).toEqual(['first', 'second'])
    expect(String(fetchMock.mock.calls[2][0])).toContain('next_page_token=page-2')
  })

  it('rejects a selected voice that is no longer available', async () => {
    maybeSingle.mockResolvedValue({ data: {
      encrypted_api_key: 'personal-secret', english_voice_id: 'missing-voice',
      czech_voice_id: null, turkish_voice_id: null,
    }, error: null })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ tier: 'creator' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ voices: [{ voice_id: 'different-voice', name: 'Different Voice' }], has_more: false }) }))

    await expect(resolveValidatedElevenLabsTts('user-1', 'english')).resolves.toBeNull()
  })
})
