import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ActivityDay } from './ActivityDay'

const meta: Meta<typeof ActivityDay> = {
  title: 'Activity/ActivityDay',
  component: ActivityDay,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof ActivityDay>

export const Empty: Story = {
  args: {
    dayLabel: 'Mon',
    reviews: 0,
    masteredWords: 0,
    isToday: false,
  },
}

export const Active: Story = {
  args: {
    dayLabel: 'Tue',
    reviews: 3,
    masteredWords: 2,
    isToday: false,
  },
}

export const Today: Story = {
  args: {
    dayLabel: 'Sun',
    reviews: 1,
    masteredWords: 1,
    isToday: true,
  },
}
