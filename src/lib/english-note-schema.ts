import { CEFR_LEVELS, PARTS_OF_SPEECH_ENGLISH, STYLE_REGISTERS } from '@/lib/types'
import type { FieldDef } from '@/lib/note-fields'

export const ENGLISH_POPULARITY_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

export const ENGLISH_NOTE_FIELDS: FieldDef[] = [
  {
    key: 'word',
    label: 'Word / Phrase',
    type: 'text',
    required: true,
  },
  {
    key: 'translation',
    label: 'Translation',
    type: 'text',
    required: true,
  },
  {
    key: 'level',
    label: 'CEFR Level',
    type: 'select',
    options: CEFR_LEVELS,
  },
  {
    key: 'part_of_speech',
    label: 'Type',
    type: 'select',
    options: PARTS_OF_SPEECH_ENGLISH,
  },
  {
    key: 'popularity',
    label: 'Popularity',
    type: 'select',
    options: ENGLISH_POPULARITY_VALUES,
    hint: 'Stored as a numeric 1-10 score and displayed as 5/10.',
  },
  {
    key: 'style',
    label: 'Style',
    type: 'select',
    options: STYLE_REGISTERS,
  },
  {
    key: 'synonyms',
    label: 'Synonyms',
    type: 'list',
    hint: 'One item per line or comma-separated.',
  },
  {
    key: 'antonyms',
    label: 'Antonyms',
    type: 'list',
    hint: 'One item per line or comma-separated.',
  },
  {
    key: 'examples_html',
    label: 'Examples (HTML list)',
    type: 'html',
    hint: 'Use <ul><li>…</li><li>…</li></ul> with the studied word wrapped in <b> tags.',
  },
]

export const ENGLISH_CANONICAL_FIELD_KEYS = ENGLISH_NOTE_FIELDS.map((field) => field.key)

const ENGLISH_STYLE_LABELS: Record<string, string> = {
  informal: 'Informal',
  neutral: 'Neutral',
  formal: 'Formal',
  everyday: 'Everyday',
  technical: 'Technical',
  academic: 'Academic',
  narrative: 'Narrative',
  slang: 'Slang',
  poetic: 'Poetic',
}

function trimString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

function normalizeEnumValue(options: readonly string[], value: unknown): string | undefined {
  const normalized = trimString(value).toLowerCase()
  if (!normalized) return undefined

  const exactMatch = options.find((option) => option.toLowerCase() === normalized)
  if (exactMatch) return exactMatch

  if (options === STYLE_REGISTERS) {
    const keywordMatch = options.find((option) => normalized.includes(option.toLowerCase()))
    if (keywordMatch) return keywordMatch
  }

  return undefined
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildExamplesHtmlFromLegacy(fields: Record<string, unknown>) {
  const directExamples = trimString(fields.collocations)
  if (directExamples) return directExamples

  const first = trimString(fields.examples_html)
  if (first) return first

  const legacyExamples = [trimString(fields.example_sentence), trimString(fields.example_translation)]
    .filter(Boolean)

  if (legacyExamples.length === 0) return ''

  return `<ul>${legacyExamples.map((example) => `<li>${example}</li>`).join('')}</ul>`
}

export function getEnglishPrimaryText(fields: Record<string, unknown>) {
  return [fields.word, fields.expression, fields.term]
    .map((value) => trimString(value))
    .find(Boolean) ?? ''
}

export function getEnglishNoteFormValues(fields: Record<string, unknown>): Record<string, string> {
  const normalized = normalizeEnglishNoteFields(fields)

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
  }
}

export function normalizeEnglishNoteFields(fields: Record<string, unknown>): Record<string, unknown> {
  const word = getEnglishPrimaryText(fields)
  const translation = trimString(fields.translation)
  const level = normalizeEnumValue(CEFR_LEVELS, fields.level)
  const partOfSpeech = normalizeEnumValue(PARTS_OF_SPEECH_ENGLISH, fields.part_of_speech)
  const style = normalizeEnumValue(STYLE_REGISTERS, fields.style)
  const popularitySource = trimString(fields.popularity) || trimString(fields.frequency)
  const popularityNumber = popularitySource
    ? Math.max(1, Math.min(10, Math.round(Number(popularitySource))))
    : undefined
  const examplesHtml = buildExamplesHtmlFromLegacy(fields)
  const synonyms = dedupeList(splitListValue(fields.synonyms))
  const antonyms = dedupeList(splitListValue(fields.antonyms))

  const normalized: Record<string, unknown> = {}

  if (word) normalized.word = word
  if (translation) normalized.translation = translation
  if (level) normalized.level = level
  if (partOfSpeech) normalized.part_of_speech = partOfSpeech
  if (style) normalized.style = style
  if (popularityNumber && Number.isFinite(popularityNumber)) normalized.popularity = popularityNumber
  if (synonyms.length > 0) normalized.synonyms = synonyms
  if (antonyms.length > 0) normalized.antonyms = antonyms
  if (examplesHtml) normalized.examples_html = examplesHtml

  return normalized
}

export function extractExamplesFromHtml(value: unknown): string[] {
  const html = trimString(value)
  if (!html) return []

  const matches = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
  if (matches.length > 0) {
    return matches.map((match) => match[1].trim()).filter(Boolean)
  }

  return html
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function formatEnglishStyleLabel(style: unknown): string {
  const normalizedStyle = normalizeEnumValue(STYLE_REGISTERS, style)
  return normalizedStyle ? ENGLISH_STYLE_LABELS[normalizedStyle] : ''
}

export function getPopularityValue(fields: Record<string, unknown>): number {
  const normalized = normalizeEnglishNoteFields(fields)
  const popularity = Number(normalized.popularity ?? 5)
  return Math.max(1, Math.min(10, Math.round(popularity)))
}

export function getPopularityDisplay(value: number): string {
  return `${Math.max(1, Math.min(10, Math.round(value)))}/10`
}

export function buildExamplesHtmlFromPlainExamples(examples: string[]): string {
  const normalized = examples.map((example) => trimString(example)).filter(Boolean)
  if (normalized.length === 0) return ''

  return `<ul>${normalized.map((example) => `<li>${escapeHtml(example)}</li>`).join('')}</ul>`
}
