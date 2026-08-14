import { CEFR_LEVELS, PARTS_OF_SPEECH_TURKISH, STYLE_REGISTERS } from '@/lib/types'
import type { FieldDef } from '@/lib/note-fields'
import {
  getEnglishNoteFormValues,
  normalizeEnglishNoteFields,
} from '@/lib/english-note-schema'

export const TURKISH_NOTE_FIELDS: FieldDef[] = [
  { key: 'word', label: 'Türkçe kelime / ifade', type: 'text', required: true },
  { key: 'translation', label: 'Çeviri', type: 'text', required: true },
  { key: 'level', label: 'CEFR seviyesi', type: 'select', options: CEFR_LEVELS },
  { key: 'part_of_speech', label: 'Sözcük türü', type: 'select', options: PARTS_OF_SPEECH_TURKISH },
  {
    key: 'popularity',
    label: 'Kullanım sıklığı',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    hint: '1–10 ölçeği.',
  },
  { key: 'style', label: 'Üslup', type: 'select', options: STYLE_REGISTERS },
  { key: 'synonyms', label: 'Eş anlamlılar', type: 'list', hint: 'Her satıra bir değer.' },
  { key: 'antonyms', label: 'Zıt anlamlılar', type: 'list', hint: 'Her satıra bir değer.' },
  {
    key: 'examples_html',
    label: 'Örnekler (HTML listesi)',
    type: 'html',
    hint: 'Çalışılan kelimeyi <b> etiketiyle vurgulayın.',
  },
]

function normalizeTurkishPartOfSpeech(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return PARTS_OF_SPEECH_TURKISH.find((option) => option.toLowerCase() === normalized)
}

export function normalizeTurkishNoteFields(fields: Record<string, unknown>) {
  const normalized = normalizeEnglishNoteFields(fields)
  const partOfSpeech = normalizeTurkishPartOfSpeech(fields.part_of_speech)
  if (partOfSpeech) normalized.part_of_speech = partOfSpeech
  return normalized
}

export function getTurkishNoteFormValues(fields: Record<string, unknown>) {
  const normalized = normalizeTurkishNoteFields(fields)
  return {
    ...getEnglishNoteFormValues(normalized),
    part_of_speech: typeof normalized.part_of_speech === 'string' ? normalized.part_of_speech : '',
  }
}
