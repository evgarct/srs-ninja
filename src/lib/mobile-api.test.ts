import { describe, expect, it } from 'vitest'
import { mapCardForMobile, parseTimeZone, splitExampleHit } from '@/lib/mobile-api'
import { shouldBypassAuthRedirect } from '@/lib/supabase/middleware'

describe('splitExampleHit', () => {
  it('splits around the bold studied phrase', () => {
    expect(splitExampleHit("I don't understand — <b>what are you driving at</b>?")).toEqual({
      pre: "I don't understand — ",
      hit: 'what are you driving at',
      post: '?',
    })
  })

  it('keeps an example without a bold phrase as plain text', () => {
    expect(splitExampleHit('Smoke rose &amp; fell.')).toEqual({ pre: 'Smoke rose & fell.', hit: '', post: '' })
  })

  it('strips other tags and uses only the first bold phrase', () => {
    expect(splitExampleHit('<i>Je</i> to <b>od</b> Prahy <b>daleko</b>.')).toEqual({
      pre: 'Je to ',
      hit: 'od',
      post: ' Prahy daleko.',
    })
  })
})

describe('mapCardForMobile', () => {
  const fields = {
    word: 'What are you driving at?',
    translation: 'На что ты намекаешь?',
    level: 'B2',
    style: 'informal',
    part_of_speech: 'idiom',
    popularity: 7,
    synonyms: ["What's your point?"],
    examples_html: '<ul><li>Tell me <b>what you are driving at</b>.</li></ul>',
  }

  it('shows the expression first on a recognition card', () => {
    const card = mapCardForMobile(
      { id: 'c1', note_id: 'n1', card_type: 'recognition', state: 'new', notes: { fields } },
      'english'
    )
    expect(card.front).toBe('What are you driving at?')
    expect(card.back).toBe('На что ты намекаешь?')
    expect(card.spoken).toBe('What are you driving at?')
    expect(card.examples).toEqual([{ pre: 'Tell me ', hit: 'what you are driving at', post: '.' }])
    expect(card.synonyms).toEqual(["What's your point?"])
    expect(card.meta).toContain('B2')
    expect(card.meta).toContain('7/10')
  })

  it('shows the translation first on a production card but still speaks the expression', () => {
    const card = mapCardForMobile(
      { id: 'c2', note_id: 'n1', card_type: 'production', state: 'review', notes: [{ fields }] },
      'english'
    )
    expect(card.front).toBe('На что ты намекаешь?')
    expect(card.back).toBe('What are you driving at?')
    expect(card.spoken).toBe('What are you driving at?')
  })
})

describe('parseTimeZone', () => {
  it('accepts a real IANA zone and falls back to UTC otherwise', () => {
    expect(parseTimeZone('Europe/Prague')).toBe('Europe/Prague')
    expect(parseTimeZone('Mars/Olympus')).toBe('UTC')
    expect(parseTimeZone(null)).toBe('UTC')
  })
})

describe('mobile API auth redirect', () => {
  it('lets Bearer-authenticated mobile calls through the cookie middleware', () => {
    expect(shouldBypassAuthRedirect('/api/mobile/home')).toBe(true)
    expect(shouldBypassAuthRedirect('/api/mobile/decks/abc/session')).toBe(true)
    expect(shouldBypassAuthRedirect('/api/mobilex')).toBe(false)
  })
})
