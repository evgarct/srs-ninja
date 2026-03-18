export function selectReviewSessionCards<
  T extends { note_id: string; card_type: string; state: string }
>(
  rawCards: T[],
  options: {
    isExtra?: boolean
    isManual?: boolean
    orderCards: (cards: T[]) => T[]
  }
) {
  const { isExtra = false, isManual = false, orderCards } = options

  if (isExtra || isManual) return rawCards

  return orderCards(rawCards)
}
