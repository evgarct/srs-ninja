import type { Rating } from '@/lib/types'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getReviewRequeueWindow(remainingCount: number, rating: Rating) {
  if (remainingCount <= 0) return null
  if (rating === 3 || rating === 4) return null

  const againMin = clamp(Math.ceil(remainingCount * 0.2), 1, remainingCount)
  const againMax = clamp(Math.ceil(remainingCount * 0.4), againMin, remainingCount)

  if (rating === 1) {
    return { min: againMin, max: againMax }
  }

  const hardMin = clamp(
    Math.max(againMax + 1, Math.ceil(remainingCount * 0.5)),
    1,
    remainingCount
  )
  const hardMax = clamp(Math.ceil(remainingCount * 0.75), hardMin, remainingCount)

  if (rating === 2) {
    return { min: hardMin, max: hardMax }
  }

  return null
}

function pickInsertIndex(
  window: { min: number; max: number },
  random: () => number
) {
  if (window.min === window.max) return window.min

  const span = window.max - window.min + 1
  return window.min + Math.floor(random() * span)
}

export function applyReviewQueueOutcome<T>(
  queue: T[],
  rating: Rating,
  options: {
    random?: () => number
  } = {}
) {
  if (queue.length === 0) return queue

  const [current, ...remaining] = queue
  const requeueWindow = getReviewRequeueWindow(remaining.length, rating)

  if (requeueWindow === null) return remaining

  const insertIndex = pickInsertIndex(requeueWindow, options.random ?? Math.random)
  const nextQueue = [...remaining]
  nextQueue.splice(insertIndex, 0, current)
  return nextQueue
}

export function excludeCurrentReviewCard<T>(queue: T[]) {
  if (queue.length === 0) return queue

  const [, ...remaining] = queue
  return remaining
}
