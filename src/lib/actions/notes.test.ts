import { describe, expect, it } from 'vitest'
import { shouldGenerateAudioForNote } from '@/lib/note-audio'

describe('shouldGenerateAudioForNote', () => {
  it('blocks audio generation for draft notes', () => {
    expect(
      shouldGenerateAudioForNote({
        language: 'english',
        status: 'draft',
        forceAudio: true,
        expressionChanged: true,
      })
    ).toBe(false)
  })

  it('allows audio generation for approved english notes when expression changes', () => {
    expect(
      shouldGenerateAudioForNote({
        language: 'english',
        status: 'approved',
        forceAudio: false,
        expressionChanged: true,
      })
    ).toBe(true)
  })

  it('allows audio generation for approved czech notes when forced', () => {
    expect(
      shouldGenerateAudioForNote({
        language: 'czech',
        status: 'approved',
        forceAudio: true,
        expressionChanged: false,
      })
    ).toBe(true)
  })

  it('blocks audio generation for unsupported note languages', () => {
    expect(
      shouldGenerateAudioForNote({
        language: 'german',
        status: 'approved',
        forceAudio: true,
        expressionChanged: true,
      })
    ).toBe(false)
  })
})
