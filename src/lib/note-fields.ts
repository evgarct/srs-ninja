import {
  CEFR_LEVELS,
  PARTS_OF_SPEECH_CZECH,
  STYLE_REGISTERS,
  GENDERS_CZECH,
  type Language,
} from './types'
import {
  ENGLISH_NOTE_FIELDS,
  getEnglishNoteFormValues,
  getEnglishPrimaryText,
  normalizeEnglishNoteFields,
} from './english-note-schema'

export const CZECH_POPULARITY_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'list' | 'html'
  options?: readonly string[]
  required?: boolean
  hint?: string
}

export const CZECH_FIELDS: FieldDef[] = [
  { key: 'word', label: 'Слово (чешский)', type: 'text', required: true },
  { key: 'translation', label: 'Перевод (рус/англ)', type: 'text', required: true },
  { key: 'pronunciation', label: 'Произношение (IPA)', type: 'text' },
  { key: 'gender', label: 'Род', type: 'select', options: GENDERS_CZECH },
  { key: 'part_of_speech', label: 'Часть речи', type: 'select', options: PARTS_OF_SPEECH_CZECH },
  { key: 'level', label: 'Уровень (CEFR)', type: 'select', options: CEFR_LEVELS },
  { key: 'style', label: 'Стиль', type: 'select', options: STYLE_REGISTERS },
  { key: 'popularity', label: 'Частотность (1-10)', type: 'select', options: CZECH_POPULARITY_VALUES },
  { key: 'example_sentence', label: 'Пример (чешский)', type: 'textarea' },
  { key: 'example_translation', label: 'Перевод примера', type: 'textarea' },
  { key: 'note', label: 'Заметка', type: 'textarea' },
  { key: 'image_url', label: 'Картинка (URL)', type: 'text' },
]

export const ENGLISH_FIELDS: FieldDef[] = ENGLISH_NOTE_FIELDS

export function getFields(language: Language): FieldDef[] {
  return language === 'czech' ? CZECH_FIELDS : ENGLISH_FIELDS
}

export function getNotePrimaryText(fields: Record<string, unknown>): string {
  const englishPrimary = getEnglishPrimaryText(fields)
  if (englishPrimary) return englishPrimary

  return [fields.word, fields.expression, fields.term]
    .find((value) => typeof value === 'string' && value.trim().length > 0)?.toString() ?? ''
}

export function normalizeNoteFields(
  fields: Record<string, unknown>,
  language?: Language
): Record<string, unknown> {
  if (language === 'english') {
    return normalizeEnglishNoteFields(fields)
  }

  const normalized = { ...fields }
  const primary = getNotePrimaryText(fields)
  const noteValue = typeof fields.note === 'string' ? fields.note.trim() : ''
  const popularityRaw =
    typeof fields.popularity === 'string' || typeof fields.popularity === 'number'
      ? String(fields.popularity).trim()
      : ''

  if (primary) {
    normalized.word = primary

    if ('expression' in normalized) {
      normalized.expression = primary
    }

    if ('term' in normalized) {
      normalized.term = primary
    }
  }

  if (noteValue) {
    normalized.note = noteValue
  } else {
    delete normalized.note
  }

  if (popularityRaw) {
    const popularity = Math.max(1, Math.min(10, Math.round(Number(popularityRaw))))
    if (Number.isFinite(popularity)) {
      normalized.popularity = popularity
    } else {
      delete normalized.popularity
    }
  } else {
    delete normalized.popularity
  }

  delete normalized.notes
  delete normalized.frequency

  return normalized
}

export function getNoteFormValues(
  language: Language,
  fields: Record<string, unknown>
): Record<string, string> {
  if (language === 'english') {
    return getEnglishNoteFormValues(fields)
  }

  return Object.fromEntries(
    Object.entries(normalizeNoteFields(fields, language)).map(([key, value]) => [key, String(value ?? '')])
  )
}

export function getNoteTitle(fields: Record<string, unknown>): string {
  const word = getNotePrimaryText(fields)
  const translation = typeof fields.translation === 'string' ? fields.translation : ''
  return translation ? `${word} — ${translation}` : word
}
