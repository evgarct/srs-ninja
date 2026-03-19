import { describe, expect, it } from 'vitest'

import {
  buildReviewHeatmapWeeks,
  getActivityIntensity,
  getCurrentWeekDateKeys,
  shiftDateKey,
} from './activity'

describe('getCurrentWeekDateKeys', () => {
  it('anchors the current week to Monday in the provided timezone', () => {
    const result = getCurrentWeekDateKeys(
      'UTC',
      new Date('2026-03-19T12:00:00Z')
    )

    expect(result.todayKey).toBe('2026-03-19')
    expect(result.weekStartKey).toBe('2026-03-16')
    expect(result.weekDateKeys).toEqual([
      '2026-03-16',
      '2026-03-17',
      '2026-03-18',
      '2026-03-19',
      '2026-03-20',
      '2026-03-21',
      '2026-03-22',
    ])
  })
})

describe('buildReviewHeatmapWeeks', () => {
  it('builds Monday-first heatmap weeks and preserves future days in the current week', () => {
    const result = buildReviewHeatmapWeeks(
      [
        {
          reviewed_at: '2026-03-10T10:00:00Z',
          rating: 3,
          state: 'review',
          card_id: 'card-1',
        },
        {
          reviewed_at: '2026-03-19T10:00:00Z',
          rating: 4,
          state: 'review',
          card_id: 'card-2',
        },
      ],
      'UTC',
      { weeks: 2, now: new Date('2026-03-19T12:00:00Z') }
    )

    expect(result.firstWeekStartKey).toBe('2026-03-09')
    expect(result.weeks).toHaveLength(2)
    expect(result.weeks[0].startDate).toBe('2026-03-09')
    expect(result.weeks[1].startDate).toBe('2026-03-16')
    expect(result.weeks[1].days[4].isFuture).toBe(true)
    expect(result.weeks[1].days[3].isToday).toBe(true)
  })
})

describe('getActivityIntensity', () => {
  it('maps review counts into stable intensity buckets', () => {
    expect(getActivityIntensity(0)).toBe(0)
    expect(getActivityIntensity(1)).toBe(1)
    expect(getActivityIntensity(8)).toBe(2)
    expect(getActivityIntensity(20)).toBe(3)
    expect(getActivityIntensity(45)).toBe(4)
  })
})

describe('shiftDateKey', () => {
  it('moves a date key by calendar days', () => {
    expect(shiftDateKey('2026-03-16', 6)).toBe('2026-03-22')
    expect(shiftDateKey('2026-03-16', -7)).toBe('2026-03-09')
  })
})
