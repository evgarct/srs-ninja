'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/cards'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/button-variants'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getNoteTitle, getFields } from '@/lib/note-fields'
import Link from 'next/link'
import type { Language, Rating } from '@/lib/types'

interface ReviewCard {
  id: string
  card_type: string
  state: string
  notes: {
    fields: Record<string, string>
    tags: string[]
    deck_id: string
  } | null
}

const RATING_LABELS: Record<Rating, { label: string; color: string; key: string }> = {
  1: { label: 'Снова', color: 'bg-red-500 hover:bg-red-600', key: '1' },
  2: { label: 'Трудно', color: 'bg-orange-500 hover:bg-orange-600', key: '2' },
  3: { label: 'Хорошо', color: 'bg-green-500 hover:bg-green-600', key: '3' },
  4: { label: 'Легко', color: 'bg-blue-500 hover:bg-blue-600', key: '4' },
}

export function ReviewSession({
  cards,
  deckId,
  language,
}: {
  cards: ReviewCard[]
  deckId: string
  language: string
}) {
  const [queue] = useState(cards)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const startTimeRef = useRef(Date.now())
  const router = useRouter()
  const fields = getFields(language as Language)

  const total = cards.length
  const current = queue[index]
  const progress = total > 0 ? Math.round(((total - (queue.length - index)) / total) * 100) : 0

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [index, revealed])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' && !revealed) {
        setRevealed(true)
        return
      }
      if (revealed) {
        const ratingMap: Record<string, Rating> = { '1': 1, '2': 2, '3': 3, '4': 4 }
        const rating = ratingMap[e.key]
        if (rating) handleRating(rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleRating(rating: Rating) {
    const durationMs = Date.now() - startTimeRef.current
    await submitReview(current.id, rating, durationMs)

    setSessionStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (rating >= 3 ? 1 : 0),
    }))

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      setDone(true)
    } else {
      setIndex(nextIndex)
      setRevealed(false)
    }
  }

  if (done) {
    const accuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold mb-2">Сессия завершена!</h2>
        <p className="text-muted-foreground mb-6">
          {sessionStats.total} карточек · {accuracy}% точность
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/deck/${deckId}`} className={buttonVariants()}>← К колоде</Link>
          <Button variant="outline" onClick={() => router.refresh()}>Продолжить</Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const noteFields = current.notes?.fields ?? {}
  const tags = current.notes?.tags ?? []
  const isRecognition = current.card_type === 'recognition'

  const frontFields = isRecognition ? ['word'] : ['translation']
  const backFields = fields.map((f) => f.key).filter((k) => !frontFields.includes(k) && noteFields[k])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Progress value={progress} className="flex-1 mr-3" />
        <span className="text-sm text-muted-foreground shrink-0">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className="text-xs">
          {isRecognition ? '👁 Распознавание' : '✍️ Воспроизведение'}
        </Badge>
        <Badge variant={current.state === 'new' ? 'secondary' : 'outline'} className="text-xs">
          {current.state}
        </Badge>
      </div>

      {/* Card */}
      <div className="rounded-xl border-2 p-6 mb-4 min-h-[180px] flex flex-col justify-center">
        <p className="text-3xl font-bold text-center mb-2">
          {noteFields[frontFields[0]] || '—'}
        </p>
        {noteFields.pronunciation && frontFields[0] === 'word' && (
          <p className="text-center text-muted-foreground text-sm">{noteFields.pronunciation}</p>
        )}

        {revealed && (
          <div className="mt-6 pt-6 border-t space-y-3">
            {backFields.map((key) => {
              const fieldDef = fields.find((f) => f.key === key)
              const value = noteFields[key]
              if (!value) return null
              return (
                <div key={key}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{fieldDef?.label ?? key}</p>
                  <p className={key === 'translation' ? 'text-xl font-semibold' : 'text-sm mt-0.5'}>{value}</p>
                </div>
              )
            })}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Показать ответ <span className="ml-2 opacity-60 text-xs">[пробел]</span>
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4] as Rating[]).map((rating) => {
            const { label, color, key } = RATING_LABELS[rating]
            return (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                className={`${color} text-white rounded-lg py-3 text-sm font-medium transition-colors`}
              >
                {label}
                <span className="block text-xs opacity-70">[{key}]</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
