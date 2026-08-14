import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveElevenLabsTts = vi.fn()
const generateAndCacheAudio = vi.fn()
const from = vi.fn()

vi.mock('@/lib/server/elevenlabs-account', () => ({ resolveElevenLabsTts }))
vi.mock('@/lib/tts', () => ({ generateAndCacheAudio }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from,
  }),
}))

import { POST } from './route'

describe('POST /api/tts/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockImplementation((table: string) => {
      if (table !== 'decks') throw new Error(`Unexpected table: ${table}`)

      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: { language: 'turkish' } }),
            }),
          }),
        }),
      }
    })
  })

  it('preflights the account and voice before fetching or generating notes', async () => {
    resolveElevenLabsTts.mockResolvedValue(null)

    const response = await POST(new Request('http://localhost/api/tts/batch', {
      method: 'POST',
      body: JSON.stringify({ deckId: 'deck-1' }),
    }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Connect ElevenLabs and choose a voice for this language',
    })
    expect(resolveElevenLabsTts).toHaveBeenCalledWith('user-1', 'turkish')
    expect(from).toHaveBeenCalledTimes(1)
    expect(generateAndCacheAudio).not.toHaveBeenCalled()
  })
})
