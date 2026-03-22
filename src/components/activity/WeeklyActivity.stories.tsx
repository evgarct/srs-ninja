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
      { date: '2026-03-09', reviews: 0, masteredWords: 0 },
      { date: '2026-03-10', reviews: 0, masteredWords: 0 },
      { date: '2026-03-11', reviews: 0, masteredWords: 0 },
      { date: '2026-03-12', reviews: 0, masteredWords: 0 },
      { date: '2026-03-13', reviews: 0, masteredWords: 0 },
      { date: '2026-03-14', reviews: 0, masteredWords: 0 },
      { date: '2026-03-15', reviews: 0, masteredWords: 0 },
    ],
  },
}

export const ActiveStreak: Story = {
  args: {
    streak: 5,
    days: [
      { date: '2026-03-09', reviews: 0, masteredWords: 0 },
      { date: '2026-03-10', reviews: 0, masteredWords: 0 },
      { date: '2026-03-11', reviews: 1, masteredWords: 1 },
      { date: '2026-03-12', reviews: 3, masteredWords: 2 },
      { date: '2026-03-13', reviews: 1, masteredWords: 1 },
      { date: '2026-03-14', reviews: 2, masteredWords: 1 },
      { date: '2026-03-15', reviews: 1, masteredWords: 1 },
    ],
  },
}
