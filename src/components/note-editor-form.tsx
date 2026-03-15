'use client'

import { useState } from 'react'
import { updateNoteFields } from '@/lib/actions/notes'
import { getFields } from '@/lib/note-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Language } from '@/lib/types'

interface NoteEditorFormProps {
  noteId: string
  deckId: string
  language: Language
  initialFields: Record<string, string>
  onSuccess?: (updatedFields: Record<string, string>, newAudioUrl?: string) => void
  onCancel?: () => void
}

export function NoteEditorForm({
  noteId,
  deckId,
  language,
  initialFields,
  onSuccess,
  onCancel,
}: NoteEditorFormProps) {
  const fields = getFields(language)
  const [values, setValues] = useState<Record<string, string>>(initialFields)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // oldExpression logic: uses 'word' by default in SRS Ninja or 'expression'
      const oldExpression = initialFields.word || initialFields.expression || initialFields.term || ''
      
      const { success, audioUrl } = await updateNoteFields(
        noteId,
        deckId,
        values,
        oldExpression,
        language
      )

      if (success) {
        toast.success('Fields updated successfully!')
        if (audioUrl) {
          toast.success('Audio regenerated successfully!')
        }
        onSuccess?.(values, audioUrl)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error updating note')
      toast.error('Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'textarea' ? (
            <Textarea
              id={field.key}
              value={values[field.key] ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="min-h-[80px]"
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
