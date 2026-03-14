'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { createNote } from '@/lib/actions/notes'
import type { Deck } from '@/lib/types'

interface ParsedNote {
  word: string
  translation: string
  extra: string
}

async function parseApkg(file: File): Promise<ParsedNote[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  // Load sql.js dynamically
  const initSqlJs = (await import('sql.js')).default
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
  })

  const dbFile = zip.file('collection.anki2') ?? zip.file('collection.anki21')
  if (!dbFile) throw new Error('Файл коллекции не найден в .apkg')

  const dbBuf = await dbFile.async('arraybuffer')
  const db = new SQL.Database(new Uint8Array(dbBuf))

  const result = db.exec(`SELECT flds FROM notes LIMIT 500`)
  if (!result.length) return []

  const notes: ParsedNote[] = result[0].values.map((row) => {
    const parts = String(row[0]).split('\x1f')
    return {
      word: parts[0] ?? '',
      translation: parts[1] ?? '',
      extra: parts[2] ?? '',
    }
  })

  db.close()
  return notes
}

export function AnkiImporter({ decks }: { decks: Deck[] }) {
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleImport() {
    if (!file || !deckId) return
    setStatus('parsing')
    setProgress(0)

    try {
      const notes = await parseApkg(file)
      setStatus('importing')

      let count = 0
      for (const note of notes) {
        if (!note.word.trim()) continue
        await createNote(deckId, {
          word: note.word,
          translation: note.translation,
          notes: note.extra,
        }, [])
        count++
        setProgress(Math.round((count / notes.length) * 100))
        setImported(count)
      }

      setStatus('done')
      router.push(`/deck/${deckId}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка импорта')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      {decks.length === 0 ? (
        <p className="text-muted-foreground">Создайте колоду перед импортом.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Label>Целевая колода</Label>
            <Select value={deckId} onValueChange={(v) => v && setDeckId(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {decks.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Файл .apkg</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".apkg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          {(status === 'importing' || status === 'parsing') && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {status === 'parsing' ? 'Разбираем файл...' : `Импортируем: ${imported} нотов`}
              </p>
            </div>
          )}

          {status === 'error' && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || !deckId || status === 'importing' || status === 'parsing'}
          >
            {status === 'importing' || status === 'parsing' ? 'Импортируем...' : 'Начать импорт'}
          </Button>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Как это работает:</p>
            <p>• Импортируются первые 3 поля каждого нота (слово, перевод, заметки)</p>
            <p>• Для каждого нота создаются 2 карточки: распознавание и воспроизведение</p>
            <p>• История повторений из Anki не переносится — FSRS начнёт с нуля</p>
            <p>• Максимум 500 нотов за один импорт</p>
          </div>
        </>
      )}
    </div>
  )
}
