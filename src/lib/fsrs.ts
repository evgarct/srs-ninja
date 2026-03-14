import { fsrs, createEmptyCard, Rating, State, type Card as FSRSCard, type RecordLogItem, type Grade } from 'ts-fsrs'
import type { Card, Rating as AppRating } from './types'

const f = fsrs()

export { Rating, State }

/**
 * Creates a new blank FSRS card with default stability and difficulty.
 * Used when generating new flashcards for a note.
 */
export function newFSRSCard(): FSRSCard {
  return createEmptyCard(new Date())
}

/**
 * Calculates the next state of a card based on the user's review rating.
 * 
 * This is the core Spaced Repetition logic using the FSRS algorithm. It takes the
 * current database card, converts it to an FSRS card, applies the rating constraint,
 * and returns the new scheduling parameters.
 * 
 * @param card - The current card data from the database.
 * @param rating - The user's rating (Again = 1, Hard = 2, Good = 3, Easy = 4).
 * @param now - The current timestamp (used as the review time).
 * @returns An object containing the updated card state for the DB, scheduled days, and elapsed days.
 */
export function scheduleCard(card: Card, rating: AppRating, now = new Date()): {
  updatedCard: Partial<Card>
  scheduledDays: number
  elapsedDays: number
} {
  const fsrsCard: FSRSCard = {
    due: new Date(card.due_at),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state === 'new' ? State.New
      : card.state === 'learning' ? State.Learning
      : card.state === 'relearning' ? State.Relearning
      : State.Review,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  }

  const result: RecordLogItem = f.next(fsrsCard, now, rating as Grade)

  const newState = result.card.state === State.New ? 'new'
    : result.card.state === State.Learning ? 'learning'
    : result.card.state === State.Relearning ? 'relearning'
    : 'review'

  return {
    updatedCard: {
      state: newState as Card['state'],
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      due_at: result.card.due.toISOString(),
      last_review: now.toISOString(),
      elapsed_days: result.log.elapsed_days,
      scheduled_days: result.card.scheduled_days,
      reps: result.card.reps,
      lapses: result.card.lapses,
    },
    scheduledDays: result.card.scheduled_days,
    elapsedDays: result.log.elapsed_days,
  }
}

/**
 * Calculates the current retrievability (probability of recall) for a card.
 * 
 * Retrievability decays exponentially over time based on the card's stability.
 * 
 * @param card - The card to compute retrievability for.
 * @param now - The current timestamp.
 * @returns A number between 0 and 1 representing the probability of recall.
 */
export function getRetrievability(card: Card, now = new Date()): number {
  const fsrsCard: FSRSCard = {
    due: new Date(card.due_at),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state === 'new' ? State.New
      : card.state === 'learning' ? State.Learning
      : card.state === 'relearning' ? State.Relearning
      : State.Review,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  }
  return f.get_retrievability(fsrsCard, now, false) as number
}

/**
 * Checks if a card is currently due for review.
 * 
 * @param card - The card to check.
 * @param now - The current timestamp.
 * @returns True if the card's due date is in the past or exactly now.
 */
export function isDue(card: Card, now = new Date()): boolean {
  return new Date(card.due_at) <= now
}
