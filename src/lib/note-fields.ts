import {
  CEFR_LEVELS,
  PARTS_OF_SPEECH_CZECH,
  PARTS_OF_SPEECH_ENGLISH,
  STYLE_REGISTERS,
  GENDERS_CZECH,
  type Language,
} from './types'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: readonly string[]
  required?: boolean
}

export const CZECH_FIELDS: FieldDef[] = [
  { key: 'word', label: 'Слово (чешский)', type: 'text', required: true },
  { key: 'translation', label: 'Перевод (рус/англ)', type: 'text', required: true },
  { key: 'pronunciation', label: 'Произношение (IPA)', type: 'text' },
  { key: 'gender', label: 'Род', type: 'select', options: GENDERS_CZECH },
  { key: 'part_of_speech', label: 'Часть речи', type: 'select', options: PARTS_OF_SPEECH_CZECH },
  { key: 'level', label: 'Уровень (CEFR)', type: 'select', options: CEFR_LEVELS },
  { key: 'style', label: 'Стиль', type: 'select', options: STYLE_REGISTERS },
  { key: 'frequency', label: 'Частотность (1-5)', type: 'select', options: ['1','2','3','4','5'] },
  { key: 'example_sentence', label: 'Пример (чешский)', type: 'textarea' },
  { key: 'example_translation', label: 'Перевод примера', type: 'textarea' },
  { key: 'notes', label: 'Заметки', type: 'textarea' },
  { key: 'image_url', label: 'Картинка (URL)', type: 'text' },
]

export const ENGLISH_FIELDS: FieldDef[] = [
  { key: 'word', label: 'Word / Phrase', type: 'text', required: true },
  { key: 'translation', label: 'Перевод (рус/чешский)', type: 'text', required: true },
  { key: 'pronunciation', label: 'Произношение (IPA)', type: 'text' },
  { key: 'part_of_speech', label: 'Part of speech', type: 'select', options: PARTS_OF_SPEECH_ENGLISH },
  { key: 'level', label: 'Уровень (CEFR)', type: 'select', options: CEFR_LEVELS },
  { key: 'style', label: 'Стиль', type: 'select', options: STYLE_REGISTERS },
  { key: 'example_sentence', label: 'Example sentence', type: 'textarea' },
  { key: 'example_translation', label: 'Перевод примера', type: 'textarea' },
  { key: 'notes', label: 'Заметки', type: 'textarea' },
]

export function getFields(language: Language): FieldDef[] {
  return language === 'czech' ? CZECH_FIELDS : ENGLISH_FIELDS
}

export function getNoteTitle(fields: Record<string, string>, language: Language): string {
  const word = fields.word || ''
  const translation = fields.translation || ''
  return translation ? `${word} — ${translation}` : word
}
