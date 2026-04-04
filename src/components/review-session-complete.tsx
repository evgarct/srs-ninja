'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft,
  CheckCheck,
  Clock3,
  Flame,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import type { ReviewSessionMode } from '@/lib/review-session-completion-state'
import { cn } from '@/lib/utils'

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
  sessionMode: ReviewSessionMode
  pendingReviewCount: number
  syncError: string | null
  stats: ReviewSessionStats
  onGoHome: () => void
}

const PARTICLES = [
  { x: -152, y: -240, delay: 0, emoji: '🎉' },
  { x: -112, y: -328, delay: 0.08, emoji: '✨' },
  { x: -58, y: -276, delay: 0.16, emoji: '🎊' },
  { x: 10, y: -344, delay: 0.12, emoji: '💥' },
  { x: 76, y: -252, delay: 0.2, emoji: '🎉' },
  { x: 138, y: -302, delay: 0.05, emoji: '✨' },
  { x: -136, y: -188, delay: 0.18, emoji: '🎊' },
  { x: 118, y: -206, delay: 0.1, emoji: '💥' },
]

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function getCompletionCopy(sessionMode: ReviewSessionMode) {
  if (sessionMode === 'manual') {
    return {
      badge: 'Manual review',
      title: 'Фильтр завершен',
      body: 'Вы прошли выбранный набор карточек. Можно вернуться к колоде или запустить новый фильтр.',
      accent: 'border-sky-400/18 bg-sky-400/10 text-sky-200',
      icon: <RotateCcw className="size-4" />,
    }
  }

  if (sessionMode === 'extra') {
    return {
      badge: 'Extra study',
      title: 'Экстра-практика завершена',
      body: 'Вы взяли дополнительные карточки сверх основной сессии. Это ускоряет темп, но не заменяет основной review.',
      accent: 'border-violet-400/18 bg-violet-400/10 text-violet-200',
      icon: <Sparkles className="size-4" />,
    }
  }

  return {
    badge: 'Done today',
    title: 'Сегодняшняя сессия завершена',
    body: 'Основной review на сегодня закрыт. Следующее повторение система подберет автоматически.',
    accent: 'border-emerald-400/18 bg-emerald-400/10 text-emerald-200',
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
  const [celebrationTick, setCelebrationTick] = useState(1)
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const difficultCount = stats.ratings.again + stats.ratings.hard
  const completionCopy = getCompletionCopy(sessionMode)
  const canRestartDue = sessionMode === 'due' && pendingReviewCount === 0
  const secondaryLinkHref = canRestartDue ? `/decks/${deckId}/review` : `/deck/${deckId}`
  const secondaryLinkLabel = canRestartDue ? 'Повторить due-сессию' : 'К колоде'

  useEffect(() => {
    if (shouldReduceMotion || syncError) return

    const intervalId = window.setInterval(() => {
      setCelebrationTick((current) => current + 1)
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [shouldReduceMotion, syncError])

  return (
    <div className="relative h-full overflow-y-auto overscroll-contain bg-[#090511] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-4 sm:pb-8 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(159,92,255,0.18)_0%,transparent_34%),radial-gradient(circle_at_bottom,rgba(242,255,119,0.08)_0%,transparent_26%),linear-gradient(180deg,#090511_0%,#0b0714_45%,#08050f_100%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(0,0,0,0.42),transparent)]" />
      </div>

      {!shouldReduceMotion && !syncError && celebrationTick > 0 && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {PARTICLES.map((particle, index) => (
            <motion.div
              key={`${celebrationTick}-${particle.x}-${particle.y}-${index}`}
              className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] flex h-10 w-10 -translate-x-1/2 items-center justify-center text-[1.75rem] drop-shadow-[0_10px_26px_rgba(15,23,42,0.18)]"
              initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.05, 1, 0.92],
                x: particle.x,
                y: particle.y,
                rotate: [0, index % 2 === 0 ? -18 : 18, index % 2 === 0 ? -10 : 10],
              }}
              transition={{ duration: 1.25, ease: 'easeOut', delay: particle.delay }}
            >
              <span aria-hidden>{particle.emoji}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-3 mb-4 px-3 pb-3 pt-1 sm:-mx-4 sm:px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(9,5,17,0.96),rgba(9,5,17,0.82),rgba(9,5,17,0))]" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            onClick={onGoHome}
            disabled={pendingReviewCount > 0}
            className="min-h-11 sm:min-w-40"
          >
            <ArrowLeft className="size-4" />
            На главную
          </Button>
          {pendingReviewCount > 0 ? (
            <Button
              variant="outline"
              disabled
              className="min-h-11 border-white/10 bg-white/[0.05] text-white/55"
            >
              {secondaryLinkLabel}
            </Button>
          ) : (
            <Link
              href={secondaryLinkHref}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-h-11 border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:text-white'
              )}
            >
              {secondaryLinkLabel}
            </Link>
          )}
        </div>
      </div>

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.985 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative mx-auto flex max-w-3xl flex-col gap-3 sm:gap-4"
      >
        <Card
          className={cn(
            'overflow-visible border-white/10 bg-[rgba(20,16,33,0.94)] text-white shadow-[0_28px_80px_-34px_rgba(0,0,0,0.82)] ring-white/6',
            sessionMode === 'due' && 'ring-1 ring-emerald-500/14'
          )}
        >
          <CardHeader className="gap-3 pb-1 text-center sm:gap-4">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.28 }}
              className="flex justify-center"
            >
              <Badge variant="outline" className={cn('mx-auto gap-1.5 border', completionCopy.accent)}>
                {completionCopy.icon}
                {completionCopy.badge}
              </Badge>
            </motion.div>

            <div className="space-y-1.5">
              <CardTitle className="text-[1.75rem] leading-tight text-white sm:text-3xl">
                {completionCopy.title}
              </CardTitle>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/64 sm:text-base">
                {completionCopy.body}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Карточек',
                  value: String(stats.total),
                  icon: <CheckCheck className="size-4 text-emerald-400" />,
                },
                {
                  label: 'Точность',
                  value: `${accuracy}%`,
                  icon: <TrendingUp className="size-4 text-sky-400" />,
                },
                {
                  label: 'Время',
                  value: formatDuration(stats.durationMs),
                  icon: <Clock3 className="size-4 text-amber-400" />,
                },
                {
                  label: 'Сложных',
                  value: String(difficultCount),
                  icon: <Flame className="size-4 text-rose-400" />,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.05, duration: 0.24 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4"
                >
                  <div className="mb-1.5 flex items-center gap-2 text-white/42">
                    {item.icon}
                    <span className="text-xs font-medium uppercase tracking-[0.12em]">{item.label}</span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.24 }}
              className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.04] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:grid-cols-4 sm:gap-3 sm:p-3"
            >
              {[
                { label: 'Again', value: stats.ratings.again, tone: 'text-destructive' },
                { label: 'Hard', value: stats.ratings.hard, tone: 'text-orange-400' },
                { label: 'Good', value: stats.ratings.good, tone: 'text-emerald-400' },
                { label: 'Easy', value: stats.ratings.easy, tone: 'text-sky-400' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/8 bg-[#110d1d] px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-4 sm:py-3"
                >
                  <p className={cn('text-sm font-semibold', item.tone)}>{item.label}</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-white sm:mt-1 sm:text-2xl">
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>

            {pendingReviewCount > 0 ? (
              <p className="text-center text-sm text-white/56">
                Сохраняем результаты... {pendingReviewCount}
              </p>
            ) : null}

            {syncError ? (
              <p className="text-center text-sm text-destructive">{syncError}</p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
