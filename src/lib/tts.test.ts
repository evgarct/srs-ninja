import { afterEach, describe, expect, it, vi } from 'vitest'

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
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns a config error when ElevenLabs key is missing', async () => {
    vi.unstubAllEnvs()

    const result = await generateAndCacheAudio(
      createSupabaseMock() as never,
      'user-1',
      'note-1',
      'anchor',
      'english'
    )

    expect(result).toEqual({ error: 'ELEVENLABS_API_KEY is not configured' })
  })

  it('returns a language error for unsupported decks', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key')

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
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key')
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
      'https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ',
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

  it('surfaces audio_cache write failures instead of pretending success', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key')
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
