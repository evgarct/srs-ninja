'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNote, updateNote } from '@/lib/actions/notes'
import { getFields } from '@/lib/note-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Language } from '@/lib/types'

interface NoteFormProps {
  deckId: string
  language: Language
  noteId?: string
  initialFields?: Record<string, string>
  initialTags?: string[]
}

/**
 * A dynamic form component used for creating or editing flashcard notes.
 * 
 * The specific input fields displayed by this form are determined dynamically 
 * based on the selected `language` (which fetches the schema from `note-fields.ts`).
 * 
 * When `noteId` is provided, the form operates in "edit" mode and calls `updateNote`.
 * When `noteId` is omitted, the form operates in "create" mode and calls `createNote`.
 * 
 * @param deckId - The UUID of the deck this note belongs to.
 * @param language - The language identifier determining the form fields.
 * @param noteId - (Optional) The UUID of the note being edited.
 * @param initialFields - (Optional) Existing field data for edit mode.
 * @param initialTags - (Optional) Existing tags for edit mode.
 */
export function NoteForm({ deckId, language, noteId, initialFields = {}, initialTags = [] }: NoteFormProps) {
  const fields = getFields(language)
  const [values, setValues] = useState<Record<string, string>>(initialFields)
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)

    try {
      if (noteId) {
        await updateNote(noteId, values, tags)
        router.push(`/deck/${deckId}`)
      } else {
        await createNote(deckId, values, tags)
        // Clear form for next note
        setValues({})
        setTagsInput('')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.type === 'select' && field.options ? (
            <Select
              value={values[field.key] ?? ''}
              onValueChange={(v) => v && setValue(field.key, v)}
            >
              <SelectTrigger id={field.key}>
                <SelectValue placeholder="Выбрать..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.key}
              value={values[field.key] ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required={field.required}
            />
          ) : (
            <Input
              id={field.key}
              value={values[field.key] ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Теги (через запятую)</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="B1, глагол, ..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Сохраняем...' : noteId ? 'Сохранить' : 'Добавить нот'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
