import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { WeeklyActivity } from './WeeklyActivity'

const meta: Meta<typeof WeeklyActivity> = {
  title: 'Activity/WeeklyActivity',
  component: WeeklyActivity,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof WeeklyActivity>

export const EmptyWeek: Story = {
  args: {
    streak: 0,
    days: [
      { date: '2026-03-16', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-17', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-18', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-19', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-20', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-21', reviews: 0, masteredWords: 0, isToday: true, isFuture: false },
      { date: '2026-03-22', reviews: 0, masteredWords: 0, isToday: false, isFuture: true },
    ],
  },
}

export const ActiveStreak: Story = {
  args: {
    streak: 5,
    days: [
      { date: '2026-03-16', reviews: 0, masteredWords: 0, isToday: false, isFuture: false },
      { date: '2026-03-17', reviews: 1, masteredWords: 1, isToday: false, isFuture: false },
      { date: '2026-03-18', reviews: 3, masteredWords: 2, isToday: false, isFuture: false },
      { date: '2026-03-19', reviews: 1, masteredWords: 1, isToday: false, isFuture: false },
      { date: '2026-03-20', reviews: 2, masteredWords: 1, isToday: false, isFuture: false },
      { date: '2026-03-21', reviews: 1, masteredWords: 1, isToday: true, isFuture: false },
      { date: '2026-03-22', reviews: 0, masteredWords: 0, isToday: false, isFuture: true },
    ],
  },
}
