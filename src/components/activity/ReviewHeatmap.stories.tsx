import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ReviewHeatmap } from './ReviewHeatmap'

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const meta: Meta<typeof ReviewHeatmap> = {
  title: 'Activity/ReviewHeatmap',
  component: ReviewHeatmap,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="dark rounded-[28px] bg-[#080511] p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ReviewHeatmap>

export const TwelveWeeks: Story = {
  args: {
    weeks: [
      ...Array.from({ length: 12 }, (_, weekIndex) => ({
        startDate: shiftDateKey('2026-01-05', weekIndex * 7),
        days: Array.from({ length: 7 }, (_, dayIndex) => ({
          date: shiftDateKey('2026-01-05', weekIndex * 7 + dayIndex),
          reviews: (weekIndex + dayIndex) % 5 === 0 ? 0 : (weekIndex + 1) * (dayIndex + 1),
          masteredWords: (weekIndex + dayIndex) % 3 === 0 ? dayIndex : 0,
          isToday: weekIndex === 11 && dayIndex === 3,
          isFuture: weekIndex === 11 && dayIndex > 3,
        })),
      })),
    ],
  },
}
