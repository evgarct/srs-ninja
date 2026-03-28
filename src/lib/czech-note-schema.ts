import {
  CEFR_LEVELS_CZECH,
  CZECH_VERB_CLASSES,
  GENDERS_CZECH_RU,
  PARTS_OF_SPEECH_CZECH,
  STYLE_REGISTERS_CZECH,
} from '@/lib/types'
import {
  buildExamplesHtmlFromPlainExamples,
  extractExamplesFromHtml,
  getPopularityDisplay,
} from '@/lib/english-note-schema'
import type { FieldDef } from '@/lib/note-fields'

export const CZECH_POPULARITY_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

export const CZECH_NOTE_FIELDS: FieldDef[] = [
  {
    key: 'word',
    label: 'Слово / фраза (чешский)',
    type: 'text',
    required: true,
  },
  {
    key: 'translation',
    label: 'Перевод (русский)',
    type: 'text',
    required: true,
  },
  {
    key: 'level',
    label: 'Уровень',
    type: 'select',
    options: CEFR_LEVELS_CZECH,
  },
  {
    key: 'part_of_speech',
    label: 'Тип',
    type: 'select',
    options: PARTS_OF_SPEECH_CZECH,
  },
  {
    key: 'popularity',
    label: 'Популярность',
    type: 'select',
    options: CZECH_POPULARITY_VALUES,
    hint: 'Шкала 1-10.',
  },
  {
    key: 'style',
    label: 'Стиль',
    type: 'select',
    options: STYLE_REGISTERS_CZECH,
  },
  {
    key: 'synonyms',
    label: 'Синонимы',
    type: 'list',
    hint: 'По одному на строку или через запятую.',
  },
  {
    key: 'antonyms',
    label: 'Антонимы',
    type: 'list',
    hint: 'По одному на строку или через запятую.',
  },
  {
    key: 'examples_html',
    label: 'Примеры (HTML список)',
    type: 'html',
    hint: 'Используйте <ul><li>…</li><li>…</li></ul> и выделяйте слово тегом <b>.',
  },
  {
    key: 'gender',
    label: 'Род',
    type: 'select',
    options: GENDERS_CZECH_RU,
    hint: 'Только для существительных.',
  },
  {
    key: 'verb_class',
    label: 'Спряжение',
    type: 'select',
    options: CZECH_VERB_CLASSES,
    hint: 'Только для глаголов.',
  },
  {
    key: 'verb_irregular',
    label: 'Исключения глагола',
    type: 'textarea',
    hint: 'Нерегулярные формы, чередования, особые замечания.',
  },
  {
    key: 'note',
    label: 'Примечание',
    type: 'textarea',
  },
]

export const CZECH_CANONICAL_FIELD_KEYS = CZECH_NOTE_FIELDS.map((field) => field.key)

function trimString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

function normalizeEnumValue(options: readonly string[], value: unknown): string | undefined {
  const normalized = trimString(value).toLowerCase()
  if (!normalized) return undefined

  return options.find((option) => option.toLowerCase() === normalized)
}

function splitListValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => trimString(entry)).filter(Boolean)
  }

  const normalized = trimString(value)
  if (!normalized) return []

  return normalized
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function dedupeList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function buildExamplesHtml(value: unknown): string {
  const html = trimString(value)
  if (!html) return ''

  if (/<li>[\s\S]*<\/li>/i.test(html)) return html

  return buildExamplesHtmlFromPlainExamples(extractExamplesFromHtml(html))
}

function getPrimaryText(fields: Record<string, unknown>): string {
  return trimString(fields.word) || trimString(fields.expression) || trimString(fields.term)
}

export function normalizeCzechNoteFields(fields: Record<string, unknown>): Record<string, unknown> {
  const word = getPrimaryText(fields)
  const translation = trimString(fields.translation)
  const level = normalizeEnumValue(CEFR_LEVELS_CZECH, fields.level)
  const partOfSpeech = normalizeEnumValue(PARTS_OF_SPEECH_CZECH, fields.part_of_speech)
  const style = normalizeEnumValue(STYLE_REGISTERS_CZECH, fields.style)
  const gender = normalizeEnumValue(GENDERS_CZECH_RU, fields.gender)
  const verbClass = normalizeEnumValue(CZECH_VERB_CLASSES, fields.verb_class)
  const verbIrregular = trimString(fields.verb_irregular)
  const note = trimString(fields.note) || trimString(fields.notes)
  const examplesHtml = buildExamplesHtml(fields.examples_html)
  const synonyms = dedupeList(splitListValue(fields.synonyms))
  const antonyms = dedupeList(splitListValue(fields.antonyms))

  const popularityRaw = trimString(fields.popularity) || trimString(fields.frequency)
  const popularityNumber = popularityRaw
    ? Math.max(1, Math.min(10, Math.round(Number(popularityRaw))))
    : undefined

  const normalized: Record<string, unknown> = {}

  if (word) normalized.word = word
  if (translation) normalized.translation = translation
  if (level) normalized.level = level
  if (partOfSpeech) normalized.part_of_speech = partOfSpeech
  if (style) normalized.style = style
  if (gender) normalized.gender = gender
  if (verbClass) normalized.verb_class = verbClass
  if (verbIrregular) normalized.verb_irregular = verbIrregular
  if (note) normalized.note = note
  if (examplesHtml) normalized.examples_html = examplesHtml
  if (synonyms.length > 0) normalized.synonyms = synonyms
  if (antonyms.length > 0) normalized.antonyms = antonyms
  if (popularityNumber && Number.isFinite(popularityNumber)) normalized.popularity = popularityNumber

  return normalized
}

export function getCzechNoteFormValues(fields: Record<string, unknown>): Record<string, string> {
  const normalized = normalizeCzechNoteFields(fields)

  return {
    word: trimString(normalized.word),
    translation: trimString(normalized.translation),
    level: trimString(normalized.level),
    part_of_speech: trimString(normalized.part_of_speech),
    popularity: normalized.popularity ? String(normalized.popularity) : '',
    style: trimString(normalized.style),
    synonyms: Array.isArray(normalized.synonyms) ? normalized.synonyms.join('\n') : '',
    antonyms: Array.isArray(normalized.antonyms) ? normalized.antonyms.join('\n') : '',
    examples_html: trimString(normalized.examples_html),
    gender: trimString(normalized.gender),
    verb_class: trimString(normalized.verb_class),
    verb_irregular: trimString(normalized.verb_irregular),
    note: trimString(normalized.note),
  }
}

export function formatCzechNoteMeta(fields: Record<string, unknown>) {
  const normalized = normalizeCzechNoteFields(fields)
  const meta: Array<{ key: string; value: string }> = []

  if (normalized.level) meta.push({ key: 'level', value: String(normalized.level) })
  if (normalized.part_of_speech) {
    meta.push({ key: 'part_of_speech', value: String(normalized.part_of_speech) })
  }
  if (normalized.popularity) {
    meta.push({
      key: 'popularity',
      value: getPopularityDisplay(Number(normalized.popularity)),
    })
  }
  if (normalized.style) meta.push({ key: 'style', value: String(normalized.style) })
  if (normalized.gender) meta.push({ key: 'gender', value: String(normalized.gender) })
  if (normalized.verb_class) meta.push({ key: 'verb_class', value: String(normalized.verb_class) })

  return meta
}

export function buildCzechFlashcardNote(fields: Record<string, unknown>): string | undefined {
  const normalized = normalizeCzechNoteFields(fields)
  const parts: string[] = []

  if (normalized.verb_class) {
    parts.push(`Спряжение: ${String(normalized.verb_class)}`)
  }

  if (normalized.verb_irregular) {
    parts.push(`Исключения: ${String(normalized.verb_irregular)}`)
  }

  if (normalized.note) {
    parts.push(String(normalized.note))
  }

  return parts.length > 0 ? parts.join(' • ') : undefined
}
