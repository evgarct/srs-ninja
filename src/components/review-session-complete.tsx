'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { CheckCheck, Clock3, Flame, RotateCcw, Sparkles, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

type SessionMode = 'due' | 'manual' | 'extra'

export interface ReviewSessionStats {
  total: number
  correct: number
  durationMs: number
  ratings: {
    again: number
    hard: number
    good: number
    easy: number
  }
}

interface ReviewSessionCompleteProps {
  deckId: string
  sessionMode: SessionMode
  pendingReviewCount: number
  syncError: string | null
  stats: ReviewSessionStats
  onGoHome: () => void
}

const PARTICLES = [
  { x: -84, y: -88, delay: 0 },
  { x: -52, y: -110, delay: 0.03 },
  { x: -18, y: -96, delay: 0.06 },
  { x: 18, y: -108, delay: 0.09 },
  { x: 54, y: -92, delay: 0.12 },
  { x: 86, y: -70, delay: 0.15 },
  { x: -72, y: -50, delay: 0.05 },
  { x: 70, y: -42, delay: 0.11 },
]

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function getCompletionCopy(sessionMode: SessionMode) {
  if (sessionMode === 'manual') {
    return {
      badge: 'Manual review',
      title: 'Фильтрованная сессия завершена',
      body: 'Вы прошли выбранный набор карточек. При желании можно вернуться к колоде и запустить новый фильтр.',
      accent: 'bg-sky-500/10 text-sky-700',
      icon: <RotateCcw className="size-4" />,
    }
  }

  if (sessionMode === 'extra') {
    return {
      badge: 'Extra study',
      title: 'Дополнительная практика завершена',
      body: 'Вы взяли дополнительные карточки сверх основной due-сессии. Это усиливает темп, но не заменяет базовый review ritual.',
      accent: 'bg-violet-500/10 text-violet-700',
      icon: <Sparkles className="size-4" />,
    }
  }

  return {
    badge: 'Done today',
    title: 'Сегодняшняя основная сессия завершена',
    body: 'Главная due-сессия по этой колоде закрыта. Следующие интервалы уже пересчитаны по качеству воспоминания, так что теперь система сама подберет следующий момент для повторения.',
    accent: 'bg-emerald-500/10 text-emerald-700',
    icon: <CheckCheck className="size-4" />,
  }
}

export function ReviewSessionComplete({
  deckId,
  sessionMode,
  pendingReviewCount,
  syncError,
  stats,
  onGoHome,
}: ReviewSessionCompleteProps) {
  const shouldReduceMotion = useReducedMotion()
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const difficultCount = stats.ratings.again + stats.ratings.hard
  const completionCopy = getCompletionCopy(sessionMode)
  const canRestartDue = sessionMode === 'due' && pendingReviewCount === 0

  return (
    <div className="relative py-8 sm:py-12">
      {sessionMode === 'due' && !shouldReduceMotion && !syncError && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center overflow-visible">
          {PARTICLES.map((particle, index) => (
            <motion.span
              key={`${particle.x}-${particle.y}-${index}`}
              className={cn(
                'absolute h-2.5 w-2.5 rounded-full',
                index % 3 === 0 && 'bg-emerald-400/80',
                index % 3 === 1 && 'bg-sky-400/80',
                index % 3 === 2 && 'bg-amber-300/80'
              )}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.85], x: particle.x, y: particle.y }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: particle.delay }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="mx-auto flex max-w-3xl flex-col gap-4"
      >
        <Card className={cn('overflow-visible ring-1', sessionMode === 'due' && 'bg-emerald-500/[0.03] ring-emerald-500/20')}>
          <CardHeader className="gap-4 pb-2 text-center">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.28 }}
              className="flex justify-center"
            >
              <Badge variant="secondary" className={cn('mx-auto gap-1.5', completionCopy.accent)}>
                {completionCopy.icon}
                {completionCopy.badge}
              </Badge>
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-2xl leading-tight sm:text-3xl">{completionCopy.title}</CardTitle>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {completionCopy.body}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Карточек',
                  value: String(stats.total),
                  icon: <CheckCheck className="size-4 text-emerald-600" />,
                },
                {
                  label: 'Точность',
                  value: `${accuracy}%`,
                  icon: <TrendingUp className="size-4 text-sky-600" />,
                },
                {
                  label: 'Время',
                  value: formatDuration(stats.durationMs),
                  icon: <Clock3 className="size-4 text-amber-600" />,
                },
                {
                  label: 'Сложных',
                  value: String(difficultCount),
                  icon: <Flame className="size-4 text-rose-600" />,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.05, duration: 0.24 }}
                  className="rounded-xl border bg-background/80 px-4 py-3 text-left"
                >
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    {item.icon}
                    <span className="text-xs font-medium uppercase tracking-[0.12em]">{item.label}</span>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.24 }}
              className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-4"
            >
              {[
                { label: 'Again', value: stats.ratings.again, tone: 'text-destructive' },
                { label: 'Hard', value: stats.ratings.hard, tone: 'text-orange-500' },
                { label: 'Good', value: stats.ratings.good, tone: 'text-green-600' },
                { label: 'Easy', value: stats.ratings.easy, tone: 'text-sky-600' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-background/80 px-4 py-3 text-center">
                  <p className={cn('text-sm font-semibold', item.tone)}>{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </motion.div>

            {pendingReviewCount > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Сохраняем результаты... {pendingReviewCount}
              </p>
            )}
            {syncError && (
              <p className="text-center text-sm text-destructive">
                {syncError}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
              {canRestartDue ? (
                <Link href={`/decks/${deckId}/review`} className={buttonVariants({ variant: 'outline' })}>
                  Повторить due-сессию
                </Link>
              ) : (
                <Button variant="outline" disabled={pendingReviewCount > 0}>
                  {pendingReviewCount > 0 ? 'Сохраняем...' : 'Due-сессия завершена'}
                </Button>
              )}
              <Button variant="outline" onClick={onGoHome} disabled={pendingReviewCount > 0}>
                ← На главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
