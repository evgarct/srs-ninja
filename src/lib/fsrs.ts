import { fsrs, createEmptyCard, Rating, State, type Card as FSRSCard, type RecordLogItem, type Grade } from 'ts-fsrs'
import type { Card, Rating as AppRating } from './types'

const f = fsrs()

export { Rating, State }

export function newFSRSCard(): FSRSCard {
  return createEmptyCard(new Date())
}

export function scheduleCard(card: Card, rating: AppRating, now = new Date()): {
  updatedCard: Partial<Card>
  scheduledDays: number
  elapsedDays: number
} {
  const fsrsCard: FSRSCard = {
    due: new Date(card.due_at),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state === 'new' ? State.New
      : card.state === 'learning' ? State.Learning
      : card.state === 'relearning' ? State.Relearning
      : State.Review,
    last_review: card.last_review_at ? new Date(card.last_review_at) : undefined,
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
      last_review_at: now.toISOString(),
      reps: result.card.reps,
      lapses: result.card.lapses,
    },
    scheduledDays: result.card.scheduled_days,
    elapsedDays: result.log.elapsed_days,
  }
}

export function getRetrievability(card: Card, now = new Date()): number {
  const fsrsCard: FSRSCard = {
    due: new Date(card.due_at),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state === 'new' ? State.New
      : card.state === 'learning' ? State.Learning
      : card.state === 'relearning' ? State.Relearning
      : State.Review,
    last_review: card.last_review_at ? new Date(card.last_review_at) : undefined,
  }
  return f.get_retrievability(fsrsCard, now, false) as number
}

export function isDue(card: Card, now = new Date()): boolean {
  return new Date(card.due_at) <= now
}
