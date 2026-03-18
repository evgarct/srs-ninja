import type { Rating } from '@/lib/types'

export function getReviewRequeueOffset(rating: Rating) {
  if (rating === 1) return 1
  if (rating === 2) return 3
  return null
}

export function applyReviewQueueOutcome<T>(
  queue: T[],
  rating: Rating
) {
  if (queue.length === 0) return queue

  const [current, ...remaining] = queue
  const requeueOffset = getReviewRequeueOffset(rating)

  if (requeueOffset === null) return remaining

  const insertIndex = Math.min(requeueOffset, remaining.length)
  const nextQueue = [...remaining]
  nextQueue.splice(insertIndex, 0, current)
  return nextQueue
}
