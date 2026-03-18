import { getFields, getNotePrimaryText, normalizeNoteFields } from '@/lib/note-fields'
import type { Language } from '@/lib/types'

export type DraftNoteStatus = 'draft' | 'approved'
export type DraftNoteSource = 'manual' | 'ai_import'
export type ImportBatchStatus = 'draft' | 'partially_approved' | 'approved' | 'archived'

export interface DraftCandidateInput {
  fields: Record<string, unknown>
  tags?: string[]
}

export interface DraftCandidate {
  fields: Record<string, unknown>
  tags: string[]
}

export interface DraftValidationIssue {
  code:
    | 'missing_required_field'
    | 'invalid_enum_value'
    | 'invalid_field_value'
    | 'unknown_field'
    | 'duplicate_note'
  field?: string
  message: string
}

export interface DraftValidationResult {
  candidate?: DraftCandidate
  errors: DraftValidationIssue[]
  warnings: DraftValidationIssue[]
}

export interface DuplicateCandidate {
  noteId: string
  primaryText: string
}

function normalizeStringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

function normalizeListValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeStringValue(entry))
      .filter(Boolean)
  }

  const normalized = normalizeStringValue(value)
  if (!normalized) return []

  return normalized
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return []

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const value = tag.trim()
    const dedupeKey = value.toLowerCase()
    if (!value || seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    normalized.push(value)
  }

  return normalized
}

function coerceEnumValue(options: readonly string[] | undefined, value: string): string | null {
  if (!options || !value) return value

  const normalizedValue = value.trim().toLowerCase()
  const match = options.find((option) => option.toLowerCase() === normalizedValue)
  return match ?? null
}

export function getDraftFieldContract(language: Language) {
  const fields = getFields(language)

  return {
    keys: fields.map((field) => field.key),
    requiredKeys: fields.filter((field) => field.required).map((field) => field.key),
    fields,
  }
}

export function validateDraftCandidate(
  language: Language,
  input: DraftCandidateInput
): DraftValidationResult {
  const { fields, requiredKeys } = getDraftFieldContract(language)
  const errors: DraftValidationIssue[] = []
  const warnings: DraftValidationIssue[] = []
  const normalizedFields: Record<string, unknown> = {}

  const inputFields = input.fields ?? {}

  for (const key of Object.keys(inputFields)) {
    if (!fields.some((field) => field.key === key)) {
      warnings.push({
        code: 'unknown_field',
        field: key,
        message: `Field "${key}" is not supported for ${language} decks and was ignored.`,
      })
    }
  }

  for (const field of fields) {
    if (field.type === 'list') {
      const rawList = normalizeListValue(inputFields[field.key])

      if (rawList.length === 0) {
        if (field.required) {
          errors.push({
            code: 'missing_required_field',
            field: field.key,
            message: `Field "${field.key}" is required.`,
          })
        }
        continue
      }

      normalizedFields[field.key] = rawList
      continue
    }

    const rawValue = normalizeStringValue(inputFields[field.key])

    if (!rawValue) {
      if (field.required) {
        errors.push({
          code: 'missing_required_field',
          field: field.key,
          message: `Field "${field.key}" is required.`,
        })
      }
      continue
    }

    if (field.type === 'select') {
      const coerced = coerceEnumValue(field.options, rawValue)
      if (!coerced) {
        errors.push({
          code: 'invalid_enum_value',
          field: field.key,
          message: `Field "${field.key}" has an unsupported value "${rawValue}".`,
        })
        continue
      }
      normalizedFields[field.key] = coerced
      continue
    }

    normalizedFields[field.key] = rawValue
  }

  const normalizedCandidateFields = normalizeNoteFields(normalizedFields, language)
  const primaryText = getNotePrimaryText(normalizedCandidateFields)

  if (!primaryText) {
    errors.push({
      code: 'missing_required_field',
      field: requiredKeys[0] ?? 'word',
      message: 'Draft note must have a primary word or phrase.',
    })
  }

  if (errors.length > 0) {
    return { errors, warnings }
  }

  return {
    candidate: {
      fields: normalizedCandidateFields,
      tags: normalizeTags(input.tags),
    },
    errors,
    warnings,
  }
}

export function findDuplicateDraftCandidates(
  existingNotes: Array<{ id: string; fields: Record<string, unknown> }>,
  candidates: DraftCandidate[]
) {
  const primaryMap = new Map<string, DuplicateCandidate>()

  for (const note of existingNotes) {
    const primaryText = getNotePrimaryText(note.fields).trim()
    if (!primaryText) continue
    primaryMap.set(primaryText.toLowerCase(), {
      noteId: note.id,
      primaryText,
    })
  }

  return candidates.flatMap((candidate, index) => {
    const primaryText = getNotePrimaryText(candidate.fields).trim()
    const duplicate = primaryMap.get(primaryText.toLowerCase())
    if (!duplicate) {
      primaryMap.set(primaryText.toLowerCase(), {
        noteId: `candidate-${index}`,
        primaryText,
      })
      return []
    }

    return [
      {
        index,
        ...duplicate,
      },
    ]
  })
}

export function getImportBatchStatus(statuses: DraftNoteStatus[]): ImportBatchStatus {
  if (statuses.length === 0) return 'draft'
  if (statuses.every((status) => status === 'approved')) return 'approved'
  if (statuses.some((status) => status === 'approved')) return 'partially_approved'
  return 'draft'
}

export function canDeleteDraftBatch(statuses: DraftNoteStatus[]): boolean {
  return statuses.every((status) => status === 'draft')
}
