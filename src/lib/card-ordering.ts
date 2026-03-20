import { REGULAR_DUE_NEW_CARD_LIMIT } from '@/lib/review-config'

/**
 * Smart card ordering for review sessions.
 *
 * Applies priority tiers, sibling separation, and shuffling so that:
 * - Forgotten cards (relearning) come first
 * - New cards are capped at 20 per session
 * - Recognition and production cards from the same note are never shown
 *   within 5 positions of each other
 */

const SIBLING_MIN_GAP = 5
const SMALL_DECK_THRESHOLD = 10

/** Fisher-Yates in-place shuffle — returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Ensures siblings (cards sharing the same note_id) are never within
 * `minGap` positions of each other.
 *
 * For small decks (< SMALL_DECK_THRESHOLD) or when a gap can't be maintained,
 * falls back to: all recognition cards (shuffled), then all production cards (shuffled).
 */
function separateSiblings<T extends { note_id: string; card_type: string }>(
  cards: T[],
  minGap: number
): T[] {
  // Small-deck fallback: recognition first, then production
  if (cards.length < SMALL_DECK_THRESHOLD) {
    const recognition = shuffle(cards.filter((c) => c.card_type === 'recognition'))
    const production = shuffle(cards.filter((c) => c.card_type === 'production'))
    const other = shuffle(
      cards.filter((c) => c.card_type !== 'recognition' && c.card_type !== 'production')
    )
    return [...recognition, ...other, ...production]
  }

  const result = [...cards]

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < Math.min(i + minGap + 1, result.length); j++) {
      if (result[i].note_id === result[j].note_id) {
        // Sibling too close — move it past the gap
        const [sibling] = result.splice(j, 1)
        const newPos = Math.min(i + minGap + 1, result.length)
        result.splice(newPos, 0, sibling)
        break
      }
    }
  }

  return result
}

/**
 * Orders due cards for a review session:
 * 1. Groups by priority tier: relearning → learning → new (capped) → review
 * 2. Shuffles within each tier
 * 3. Separates sibling cards (same note, different card_type)
 */
export function orderCards<
  T extends { note_id: string; card_type: string; state: string }
>(dueCards: T[]): T[] {
  const relearning = shuffle(dueCards.filter((c) => c.state === 'relearning'))
  const learning = shuffle(dueCards.filter((c) => c.state === 'learning'))
  const review = shuffle(dueCards.filter((c) => c.state === 'review'))
  const newCards = shuffle(dueCards.filter((c) => c.state === 'new')).slice(
    0,
    REGULAR_DUE_NEW_CARD_LIMIT
  )

  const ordered = [...relearning, ...learning, ...newCards, ...review]

  return separateSiblings(ordered, SIBLING_MIN_GAP)
}
