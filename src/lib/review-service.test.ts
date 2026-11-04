import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getDueCardsForUser, parseReviewRating, submitReviewForUser } from '@/lib/review-service'

type Call = { method: string; args: unknown[] }

/** Chainable fake: records calls, resolves to the queued result when awaited or on .single(). */
function createFakeSupabase(results: Record<string, { data: unknown; error: unknown }>) {
  const calls: Record<string, Call[]> = {}

  const from = (table: string) => {
    const log = (calls[table] ??= [])
    const result = results[table] ?? { data: null, error: null }
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'lte', 'order', 'limit', 'update', 'insert']) {
      builder[method] = (...args: unknown[]) => {
        log.push({ method, args })
        return builder
      }
    }
    builder.single = () => Promise.resolve(result)
    builder.then = (resolve: (value: unknown) => void) => resolve(result)
    return builder
  }

  return { client: { from } as unknown as SupabaseClient<Database>, calls }
}

const dueCard = {
  id: 'card-1',
  user_id: 'user-1',
  note_id: 'note-1',
  card_type: 'production',
  state: 'new',
  stability: 0,
  difficulty: 0,
  due_at: '2026-11-01T00:00:00.000Z',
  elapsed_days: 0,
  scheduled_days: 0,
  reps: 0,
  lapses: 0,
  last_review: null,
}

describe('parseReviewRating', () => {
  it('accepts names and numbers, rejects the rest', () => {
    expect(parseReviewRating('again')).toBe(1)
    expect(parseReviewRating(' Good ')).toBe(3)
    expect(parseReviewRating(4)).toBe(4)
    expect(parseReviewRating(5)).toBeNull()
    expect(parseReviewRating('great')).toBeNull()
  })
})

describe('getDueCardsForUser', () => {
  it('filters by user when a user id is given and only by RLS otherwise', async () => {
    const withUser = createFakeSupabase({ cards: { data: [], error: null } })
    await getDueCardsForUser(withUser.client, 'deck-1', 10, 'user-1')
    expect(withUser.calls.cards).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] })

    const withoutUser = createFakeSupabase({ cards: { data: [], error: null } })
    await getDueCardsForUser(withoutUser.client, 'deck-1', 10)
    expect(withoutUser.calls.cards.some((call) => call.args[0] === 'user_id')).toBe(false)
  })
})

describe('submitReviewForUser', () => {
  it('scopes every query to the user and logs the review', async () => {
    const { client, calls } = createFakeSupabase({ cards: { data: dueCard, error: null }, reviews: { data: null, error: null } })

    const result = await submitReviewForUser(client, 'user-1', 'card-1', 3, 1200)

    expect(calls.cards.filter((call) => call.method === 'eq' && call.args[0] === 'user_id')).toHaveLength(2)
    expect(result.updatedCard.due_at).toBeDefined()
    const insert = calls.reviews.find((call) => call.method === 'insert')
    expect(insert?.args[0]).toMatchObject({ card_id: 'card-1', user_id: 'user-1', rating: 3, review_duration_ms: 1200 })
  })

  it('throws and writes nothing when the card is missing or foreign', async () => {
    const notFound = { message: 'no rows' }
    const { client, calls } = createFakeSupabase({ cards: { data: null, error: notFound } })
    const spy = vi.fn()

    await submitReviewForUser(client, 'user-2', 'card-1', 3, 0).catch(spy)

    expect(spy).toHaveBeenCalledWith(notFound)
    expect(calls.reviews).toBeUndefined()
  })
})
