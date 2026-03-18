import { getNotePrimaryText } from '@/lib/note-fields'
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
  const expression = getNotePrimaryText(fields) || '—'
  const translation = String(fields.translation ?? '—')
  const examples = language === 'english'
    ? extractExamplesFromHtml(fields.examples_html ?? fields.collocations ?? '')
    : [fields.example_sentence, fields.example_translation]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const rawLevel = String(fields.level ?? '')
  const level: CEFRLevel = validLevels.includes(rawLevel as CEFRLevel)
    ? (rawLevel as CEFRLevel)
    : 'B1'

  const frequency = language === 'english'
    ? getPopularityValue(fields)
    : Math.min(10, Math.max(1, Math.round(Number(fields.frequency ?? 5))))
  const style = language === 'english'
    ? formatEnglishStyleLabel(fields.style)
    : String(fields.style ?? '')
  const partOfSpeech = String(fields.part_of_speech ?? '')
  const gender = language === 'czech' ? (fields.gender ? String(fields.gender) : undefined) : undefined
  const note = fields.note ? String(fields.note) : undefined
  const imageUrl = fields.image_url ? String(fields.image_url) : undefined

  const synonyms = Array.isArray(fields.synonyms)
    ? (fields.synonyms as unknown[]).map(String)
    : undefined
  const antonyms = Array.isArray(fields.antonyms)
    ? (fields.antonyms as unknown[]).map(String)
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
