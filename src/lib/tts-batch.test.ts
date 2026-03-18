import { describe, expect, it } from 'vitest'

import { summarizeBatchAudioResults } from './tts-batch'

describe('summarizeBatchAudioResults', () => {
  it('returns a 500 payload when the whole batch fails', () => {
    const result = summarizeBatchAudioResults([
      { noteId: 'note-1', status: 'error', error: 'Failed to update audio cache' },
      { noteId: 'note-2', status: 'error', error: 'TTS generation failed' },
    ])

    expect(result.status).toBe(500)
    expect(result.body).toEqual({
      total: 2,
      generated: 0,
      skipped: 0,
      errors: 2,
      error: 'Failed to update audio cache',
      errorMessages: ['Failed to update audio cache', 'TTS generation failed'],
      generatedAudio: [],
    })
  })

  it('keeps partial-success batches successful while preserving error details', () => {
    const result = summarizeBatchAudioResults([
      { noteId: 'note-1', status: 'ok', audioUrl: 'https://cdn.test/a.mp3' },
      { noteId: 'note-2', status: 'error', error: 'Upload failed' },
      { noteId: 'note-3', status: 'skip' },
    ])

    expect(result.status).toBe(200)
    expect(result.body).toEqual({
      total: 3,
      generated: 1,
      skipped: 1,
      errors: 1,
      errorMessages: ['Upload failed'],
      generatedAudio: [{ noteId: 'note-1', audioUrl: 'https://cdn.test/a.mp3' }],
    })
  })
})
