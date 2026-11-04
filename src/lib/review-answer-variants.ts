import { mapFieldsToFlashcard } from '@/lib/flashcard-mapping'
import type { Language } from '@/lib/types'

export type ReviewDirection = 'recognition' | 'production'

const VARIANT_SEPARATOR = /[,;/]/

export function normalizeForCompare(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function splitVariants(text: string) {
  return text
    .split(VARIANT_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part && part !== '—')
}

function dedupeVariants(variants: string[]) {
  const seen = new Set<string>()
  return variants.filter((variant) => {
    const key = normalizeForCompare(variant)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Question/answer sides follow the in-app flashcard: production shows the translation
 * and asks for the expression, recognition is the reverse.
 */
export function buildReviewCardSides(
  fields: Record<string, unknown>,
  language: Language,
  direction: ReviewDirection
) {
  const flashcard = mapFieldsToFlashcard(fields, language)
  const question = direction === 'production' ? flashcard.translation : flashcard.expression
  const answer = direction === 'production' ? flashcard.expression : flashcard.translation

  // Synonyms are alternatives for the studied expression, so they only apply
  // when the learner has to produce it.
  const variants = splitVariants(answer)
  if (direction === 'production') variants.push(...(flashcard.synonyms ?? []))

  const acceptedAnswers = dedupeVariants(variants)
  const hints = Object.fromEntries(
    Object.entries({
      partOfSpeech: flashcard.partOfSpeech,
      gender: flashcard.gender,
      note: flashcard.note,
    }).filter(([, value]) => typeof value === 'string' && value.trim())
  ) as { partOfSpeech?: string; gender?: string; note?: string }

  return {
    question,
    answer,
    acceptedAnswers,
    acceptedAnswersNormalized: acceptedAnswers.map(normalizeForCompare),
    hints,
  }
}
