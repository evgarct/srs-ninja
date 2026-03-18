import {
  extractExamplesFromHtml,
  formatEnglishStyleLabel,
  getPopularityDisplay,
  getPopularityValue,
} from '@/lib/english-note-schema'
import { getFields } from '@/lib/note-fields'
import type { Language } from '@/lib/types'

export interface DraftNoteDisplayMetaItem {
  key: string
  label: string
  value: string
}

export interface DraftNoteDisplayListItem {
  key: string
  label: string
  values: string[]
}

export interface DraftNoteDisplayState {
  meta: DraftNoteDisplayMetaItem[]
  lists: DraftNoteDisplayListItem[]
  examples: string[]
  fallback: DraftNoteDisplayMetaItem[]
}

function normalizeTextValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function normalizeListValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeTextValue(entry))
      .filter(Boolean)
  }

  const normalized = normalizeTextValue(value)
  if (!normalized) return []

  return normalized
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getFieldLabelMap(language: Language) {
  return new Map(getFields(language).map((field) => [field.key, field.label]))
}

export function getDraftNoteDisplayState(
  fields: Record<string, unknown>,
  language: Language
): DraftNoteDisplayState {
  const labelMap = getFieldLabelMap(language)

  if (language === 'english') {
    const meta: DraftNoteDisplayMetaItem[] = []
    const lists: DraftNoteDisplayListItem[] = []
    const fallback: DraftNoteDisplayMetaItem[] = []
    const examples = extractExamplesFromHtml(fields.examples_html ?? fields.collocations)

    const level = normalizeTextValue(fields.level)
    if (level) {
      meta.push({ key: 'level', label: labelMap.get('level') ?? 'Level', value: level })
    }

    const partOfSpeech = normalizeTextValue(fields.part_of_speech)
    if (partOfSpeech) {
      meta.push({
        key: 'part_of_speech',
        label: labelMap.get('part_of_speech') ?? 'Type',
        value: partOfSpeech,
      })
    }

    const popularityRaw = fields.popularity ?? fields.frequency
    if (popularityRaw !== undefined && popularityRaw !== null && normalizeTextValue(popularityRaw)) {
      meta.push({
        key: 'popularity',
        label: labelMap.get('popularity') ?? 'Popularity',
        value: getPopularityDisplay(getPopularityValue(fields)),
      })
    }

    const style = formatEnglishStyleLabel(fields.style)
    if (style) {
      meta.push({ key: 'style', label: labelMap.get('style') ?? 'Style', value: style })
    }

    const synonyms = normalizeListValue(fields.synonyms)
    if (synonyms.length > 0) {
      lists.push({
        key: 'synonyms',
        label: labelMap.get('synonyms') ?? 'Synonyms',
        values: synonyms,
      })
    }

    const antonyms = normalizeListValue(fields.antonyms)
    if (antonyms.length > 0) {
      lists.push({
        key: 'antonyms',
        label: labelMap.get('antonyms') ?? 'Antonyms',
        values: antonyms,
      })
    }

    const handledKeys = new Set([
      'word',
      'translation',
      'examples_html',
      'collocations',
      'level',
      'part_of_speech',
      'popularity',
      'frequency',
      'style',
      'synonyms',
      'antonyms',
    ])

    for (const [key, rawValue] of Object.entries(fields)) {
      if (handledKeys.has(key)) continue
      const value = normalizeTextValue(rawValue)
      if (!value) continue
      fallback.push({
        key,
        label: labelMap.get(key) ?? key,
        value,
      })
    }

    return {
      meta,
      lists,
      examples,
      fallback,
    }
  }

  const fallback = Object.entries(fields)
    .map(([key, value]) => ({
      key,
      label: labelMap.get(key) ?? key,
      value: normalizeTextValue(value),
    }))
    .filter((item) => item.value)

  return {
    meta: [],
    lists: [],
    examples: [],
    fallback,
  }
}
