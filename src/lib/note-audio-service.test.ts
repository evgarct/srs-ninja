import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

const tts = vi.hoisted(() => ({ generateAndCacheAudio: vi.fn() }))
vi.mock('@/lib/tts', () => tts)
const account = vi.hoisted(() => ({ resolveValidatedElevenLabsTts: vi.fn() }))
vi.mock('@/lib/server/elevenlabs-account', () => account)

import { DeckAudioError, generateDeckAudioForUser } from '@/lib/note-audio-service'

function fakeSupabase(language: string, notes: Array<{ id: string; fields: Record<string, unknown> }>, cachedNoteIds: string[]) {
  return {
    from(table: string) {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        single: async () => ({ data: table === 'decks' ? { language } : null }),
        then(resolve: (value: unknown) => unknown) {
          const data = table === 'audio_cache' ? cachedNoteIds.map((id) => ({ note_id: id, storage_path: `u/${id}` })) : notes
          return Promise.resolve({ data, error: null }).then(resolve)
        },
      }
      return builder
    },
  } as unknown as SupabaseClient
}

const notes = [
  { id: 'n1', fields: { word: 'nit' } },
  { id: 'n2', fields: { word: 'jehla' } },
  { id: 'n3', fields: { word: 'nůžky' } },
  { id: 'n4', fields: {} },
]

beforeEach(() => {
  vi.clearAllMocks()
  account.resolveValidatedElevenLabsTts.mockResolvedValue({ apiKey: 'k', config: { voiceId: 'v' } })
  tts.generateAndCacheAudio.mockImplementation(async (_s, _u, noteId: string) => ({ audioUrl: `u/${noteId}` }))
})

describe('generateDeckAudioForUser', () => {
  it('voices only notes without audio, up to the limit, and reports the rest', async () => {
    const result = await generateDeckAudioForUser(fakeSupabase('czech', notes, ['n1']), 'user-1', 'deck', { limit: 2, delayMs: 0 })

    expect(tts.generateAndCacheAudio.mock.calls.map((call) => call[2])).toEqual(['n2', 'n3'])
    expect(result).toMatchObject({ alreadyVoiced: 1, remaining: 1 })
  })

  it('regenerates existing audio with force and skips notes without text', async () => {
    const result = await generateDeckAudioForUser(fakeSupabase('czech', notes, ['n1']), 'user-1', 'deck', { force: true, delayMs: 0 })

    expect(tts.generateAndCacheAudio).toHaveBeenCalledTimes(3)
    expect(result.results.find((entry) => entry.noteId === 'n4')?.status).toBe('skip')
    expect(result.remaining).toBe(0)
  })

  it('fails with a clear error when no voice is configured', async () => {
    account.resolveValidatedElevenLabsTts.mockResolvedValue(null)
    await expect(generateDeckAudioForUser(fakeSupabase('czech', notes, []), 'user-1', 'deck')).rejects.toBeInstanceOf(DeckAudioError)
  })
})
