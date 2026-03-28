import {
  type Language,
} from './types'
import {
  CZECH_NOTE_FIELDS,
  getCzechNoteFormValues,
  normalizeCzechNoteFields,
} from './czech-note-schema'
import {
  getEnglishNoteFormValues,
  getEnglishPrimaryText,
  ENGLISH_NOTE_FIELDS,
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

export const CZECH_FIELDS: FieldDef[] = CZECH_NOTE_FIELDS

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

  return normalizeCzechNoteFields(fields)
}

export function getNoteFormValues(
  language: Language,
  fields: Record<string, unknown>
): Record<string, string> {
  if (language === 'english') {
    return getEnglishNoteFormValues(fields)
  }

  return getCzechNoteFormValues(fields)
}

export function getNoteTitle(fields: Record<string, unknown>): string {
  const word = getNotePrimaryText(fields)
  const translation = typeof fields.translation === 'string' ? fields.translation : ''
  return translation ? `${word} — ${translation}` : word
}
