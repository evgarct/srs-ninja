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
