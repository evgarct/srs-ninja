import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { resolveElevenLabsTts } = vi.hoisted(() => ({ resolveElevenLabsTts: vi.fn() }))
vi.mock('@/lib/server/elevenlabs-account', () => ({ resolveElevenLabsTts }))

import { generateAndCacheAudio } from './tts'

function createSupabaseMock({
  uploadError = null,
  cacheError = null,
}: {
  uploadError?: { message: string } | null
  cacheError?: { message: string } | null
} = {}) {
  return {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: uploadError })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://cdn.test/audio/user-1/note-1.mp3' },
        })),
      })),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(async () => ({ error: cacheError })),
    })),
  }
}

describe('generateAndCacheAudio', () => {
  beforeEach(() => {
    resolveElevenLabsTts.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns a config error when ElevenLabs key is missing', async () => {
    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'anchor',
      'english'
    )

    expect(result).toEqual({ error: 'Connect ElevenLabs and choose a voice for this language' })
  })

  it('returns a language error for unsupported decks', async () => {
    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'anchor',
      'german'
    )

    expect(result).toEqual({ error: 'TTS is not supported for german decks' })
  })

  it('uses Czech voice and language settings for Czech notes', async () => {
    resolveElevenLabsTts.mockResolvedValue({
      apiKey: 'test-key',
      config: { voiceId: 'czech-voice', modelId: 'eleven_flash_v2_5', languageCode: 'cs' },
    })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'ahoj',
      'czech'
    )

    expect(result).toHaveProperty('audioUrl')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/czech-voice',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          text: 'ahoj',
          model_id: 'eleven_flash_v2_5',
          language_code: 'cs',
        }),
      })
    )
  })

  it('requires a configured Turkish voice', async () => {
    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'merhaba',
      'turkish'
    )

    expect(result).toEqual({ error: 'Connect ElevenLabs and choose a voice for this language' })
  })

  it('uses the configured Turkish voice and language code', async () => {
    resolveElevenLabsTts.mockResolvedValue({
      apiKey: 'test-key',
      config: { voiceId: 'turkish-voice', modelId: 'eleven_flash_v2_5', languageCode: 'tr' },
    })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'merhaba',
      'turkish'
    )

    expect(result).toHaveProperty('audioUrl')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/turkish-voice',
      expect.objectContaining({
        body: JSON.stringify({
          text: 'merhaba',
          model_id: 'eleven_flash_v2_5',
          language_code: 'tr',
        }),
      })
    )
  })

  it('surfaces audio_cache write failures instead of pretending success', async () => {
    resolveElevenLabsTts.mockResolvedValue({
      apiKey: 'test-key',
      config: { voiceId: 'english-voice', modelId: 'eleven_flash_v2_5', languageCode: 'en' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      }))
    )

    const result = await generateAndCacheAudio(
      createSupabaseMock({
        cacheError: { message: 'column "field_key" does not exist' },
      }) as never,
      'user-1',
      'note-1',
      'anchor',
      'english'
    )

    expect(result).toEqual({
      error: 'Failed to update audio cache: column "field_key" does not exist',
    })
  })
})
