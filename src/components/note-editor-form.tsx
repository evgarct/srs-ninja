'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateNoteFields } from '@/lib/actions/notes'
import { getFields, getNoteFormValues, getNotePrimaryText, normalizeNoteFields } from '@/lib/note-fields'
import { parseTagsInput } from '@/lib/note-tags'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Language } from '@/lib/types'
import { PlayButton } from '@/components/flashcard/PlayButton'
import { playAudioUrl } from '@/lib/audio'

interface NoteEditorFormProps {
  noteId: string
  deckId: string
  language: Language
  initialFields: Record<string, unknown>
  initialTags?: string[]
  initialAudioUrl?: string
  allowAudioGeneration?: boolean
  onSuccess?: (
    updatedFields: Record<string, unknown>,
    updatedTags: string[],
    newAudioUrl?: string,
    audioError?: string
  ) => void
  onCancel?: () => void
}

export function NoteEditorForm({
  noteId,
  deckId,
  language,
  initialFields,
  initialTags = [],
  initialAudioUrl,
  allowAudioGeneration = true,
  onSuccess,
  onCancel,
}: NoteEditorFormProps) {
  const fields = getFields(language)
  const [values, setValues] = useState<Record<string, string>>(getNoteFormValues(language, initialFields))
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentAudioUrl, setCurrentAudioUrl] = useState(initialAudioUrl)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    setCurrentAudioUrl(initialAudioUrl)
  }, [initialAudioUrl])

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function submitForm(e?: React.FormEvent, forceAudio: boolean = false) {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const normalizedValues = normalizeNoteFields(values, language)
      const normalizedTags = parseTagsInput(tagsInput)
      const oldExpression = getNotePrimaryText(initialFields)

      const { success, audioUrl, audioError } = await updateNoteFields(
        noteId,
        deckId,
        normalizedValues,
        normalizedTags,
        oldExpression,
        language,
        forceAudio && allowAudioGeneration
      )

      if (success) {
        toast.success('Fields updated successfully!')
        if (audioUrl) {
          setCurrentAudioUrl(audioUrl)
          toast.success('Audio regenerated successfully!')
          void playAudioUrl(audioUrl)
        }
        if (audioError) {
          toast.error(audioError)
        }
        onSuccess?.(normalizedValues, normalizedTags, audioUrl, audioError)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error updating note')
      toast.error('Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  function handleForceAudioSave() {
    const form = formRef.current
    if (form && !form.reportValidity()) return

    void submitForm(undefined, true)
  }

  return (
    <form ref={formRef} onSubmit={(e) => submitForm(e, false)} className="space-y-4 py-4 w-full">
      {allowAudioGeneration && currentAudioUrl && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Audio preview</p>
            <p className="text-xs text-muted-foreground">
              Проигрывает актуальное аудио для этой ноты
            </p>
          </div>
          <PlayButton
            onPlay={() => {
              void playAudioUrl(currentAudioUrl)
            }}
            className="h-9 w-9"
          />
        </div>
      )}

      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.hint && (
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          )}
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
          ) : field.type === 'textarea' || field.type === 'list' || field.type === 'html' ? (
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="ENGLISH::topic.travel, ENGLISH::level.b1, ENGLISH::style.neutral"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2 pt-4">
        {allowAudioGeneration && language === 'english' && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleForceAudioSave}
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save & Regenerate Audio'}
          </Button>
        )}
        <div className="flex gap-2 w-full">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
