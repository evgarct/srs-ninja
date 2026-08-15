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
  {
    key: 'usage_pattern',
    label: 'Kullanım kalıbı',
    type: 'text',
    hint: 'Gerekli durum eki veya tipik yapı; ör. birine yardım etmek.',
  },
  {
    key: 'grammar_note',
    label: 'Dil bilgisi notu',
    type: 'textarea',
    hint: 'Ünlü uyumu, kök değişimi veya öğrenilmesi gereken bir istisna.',
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
  const usagePattern = typeof fields.usage_pattern === 'string' ? fields.usage_pattern.trim() : ''
  const grammarNote = typeof fields.grammar_note === 'string'
    ? fields.grammar_note.trim()
    : typeof fields.note === 'string'
      ? fields.note.trim()
      : ''
  if (usagePattern) normalized.usage_pattern = usagePattern
  if (grammarNote) normalized.grammar_note = grammarNote
  return normalized
}

export function getTurkishNoteFormValues(fields: Record<string, unknown>) {
  const normalized = normalizeTurkishNoteFields(fields)
  return {
    ...getEnglishNoteFormValues(normalized),
    part_of_speech: typeof normalized.part_of_speech === 'string' ? normalized.part_of_speech : '',
    usage_pattern: typeof normalized.usage_pattern === 'string' ? normalized.usage_pattern : '',
    grammar_note: typeof normalized.grammar_note === 'string' ? normalized.grammar_note : '',
  }
}

export function buildTurkishFlashcardNote(fields: Record<string, unknown>): string | undefined {
  const normalized = normalizeTurkishNoteFields(fields)
  const parts: string[] = []
  if (normalized.usage_pattern) parts.push(`Kalıp: ${String(normalized.usage_pattern)}`)
  if (normalized.grammar_note) parts.push(String(normalized.grammar_note))
  return parts.length > 0 ? parts.join(' • ') : undefined
}
