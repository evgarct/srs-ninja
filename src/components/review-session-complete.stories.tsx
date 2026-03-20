import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'

import { ReviewSessionComplete } from './review-session-complete'

const meta: Meta<typeof ReviewSessionComplete> = {
  title: 'Review/ReviewSessionComplete',
  component: ReviewSessionComplete,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[min(56rem,calc(100vw-2rem))] p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    deckId: 'deck-1',
    sessionMode: 'due',
    pendingReviewCount: 0,
    syncError: null,
    onGoHome: fn(),
    stats: {
      total: 48,
      correct: 39,
      durationMs: 329000,
      ratings: {
        again: 4,
        hard: 5,
        good: 27,
        easy: 12,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof ReviewSessionComplete>

export const DueReview: Story = {}

export const ManualReview: Story = {
  args: {
    sessionMode: 'manual',
  },
}

export const ExtraStudy: Story = {
  args: {
    sessionMode: 'extra',
  },
}

export const SyncPending: Story = {
  args: {
    pendingReviewCount: 2,
  },
}

export const SyncError: Story = {
  args: {
    syncError: 'Часть результатов не сохранилась. Лучше обновить страницу и проверить историю review.',
  },
}
