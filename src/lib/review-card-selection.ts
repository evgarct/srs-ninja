export const DEFAULT_REVIEW_CANDIDATE_MULTIPLIER = 4

export function getReviewSessionCandidateLimit(
  sessionLimit: number,
  multiplier = DEFAULT_REVIEW_CANDIDATE_MULTIPLIER
) {
  return Math.max(sessionLimit, sessionLimit * multiplier)
}

export function selectReviewSessionCards<
  T extends { note_id: string; card_type: string; state: string }
>(
  rawCards: T[],
  options: {
    isExtra?: boolean
    isManual?: boolean
    orderCards: (cards: T[]) => T[]
    sessionLimit?: number
  }
) {
  const {
    isExtra = false,
    isManual = false,
    orderCards,
    sessionLimit,
  } = options

  if (isExtra || isManual) return rawCards

  const ordered = orderCards(rawCards)

  if (sessionLimit === undefined) return ordered

  return ordered.slice(0, sessionLimit)
}
