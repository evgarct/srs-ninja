import { getNotePrimaryText, normalizeNoteFields } from '@/lib/note-fields'
import {
  extractExamplesFromHtml,
  formatEnglishStyleLabel,
  getPopularityValue,
} from '@/lib/english-note-schema'
import type { CEFRLevel, Language } from '@/lib/types'

export function mapFieldsToFlashcard(
  fields: Record<string, unknown>,
  language: Language
) {
  const normalizedFields = normalizeNoteFields(fields, language)
  const expression = getNotePrimaryText(normalizedFields) || '—'
  const translation = String(normalizedFields.translation ?? '—')
  const examples = language === 'english'
    ? extractExamplesFromHtml(normalizedFields.examples_html ?? fields.collocations ?? '')
    : [normalizedFields.example_sentence, normalizedFields.example_translation]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const rawLevel = String(normalizedFields.level ?? '')
  const level: CEFRLevel = validLevels.includes(rawLevel as CEFRLevel)
    ? (rawLevel as CEFRLevel)
    : 'B1'

  const frequency = language === 'english'
    ? getPopularityValue(normalizedFields)
    : Math.min(10, Math.max(1, Math.round(Number(normalizedFields.popularity ?? normalizedFields.frequency ?? 5))))
  const style = language === 'english'
    ? formatEnglishStyleLabel(normalizedFields.style)
    : String(normalizedFields.style ?? '')
  const partOfSpeech = String(normalizedFields.part_of_speech ?? '')
  const gender = language === 'czech' ? (normalizedFields.gender ? String(normalizedFields.gender) : undefined) : undefined
  const note = normalizedFields.note ? String(normalizedFields.note) : undefined
  const imageUrl =
    normalizedFields.image_url || fields.image_url ? String(normalizedFields.image_url ?? fields.image_url) : undefined

  const synonyms = Array.isArray(normalizedFields.synonyms)
    ? (normalizedFields.synonyms as unknown[]).map(String)
    : undefined
  const antonyms = Array.isArray(normalizedFields.antonyms)
    ? (normalizedFields.antonyms as unknown[]).map(String)
    : undefined

  return {
    expression,
    translation,
    examples,
    level,
    partOfSpeech,
    gender,
    frequency,
    style,
    note,
    imageUrl,
    synonyms,
    antonyms,
  }
}
