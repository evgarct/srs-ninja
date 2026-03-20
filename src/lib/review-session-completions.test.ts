import { describe, expect, it } from 'vitest'

import {
  getCompletedTodayDeckIds,
  isMissingCompletionTableError,
} from './review-session-completions'

describe('isMissingCompletionTableError', () => {
  it('recognizes missing table errors from Postgres and PostgREST', () => {
    expect(isMissingCompletionTableError({ code: '42P01' })).toBe(true)
    expect(isMissingCompletionTableError({ code: 'PGRST205' })).toBe(true)
    expect(
      isMissingCompletionTableError({
        message: 'relation "public.review_session_completions" does not exist',
      })
    ).toBe(true)
  })

  it('does not swallow unrelated errors', () => {
    expect(
      isMissingCompletionTableError({
        code: '42501',
        message: 'new row violates row-level security policy',
      })
    ).toBe(false)
    expect(isMissingCompletionTableError(null)).toBe(false)
  })
})

describe('getCompletedTodayDeckIds', () => {
  it('returns deck ids when completion rows are available', () => {
    const ids = getCompletedTodayDeckIds(
      [{ deck_id: 'deck-1' }, { deck_id: 'deck-2' }, { deck_id: 'deck-1' }],
      null
    )

    expect([...ids]).toEqual(['deck-1', 'deck-2'])
  })

  it('falls back to an empty set when the completion table is missing', () => {
    const ids = getCompletedTodayDeckIds(
      [{ deck_id: 'deck-1' }],
      { code: '42P01' }
    )

    expect(ids.size).toBe(0)
  })
})
