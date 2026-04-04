import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'

import { ReviewSessionComplete } from './review-session-complete'

const meta: Meta<typeof ReviewSessionComplete> = {
  title: 'Review/Screens/ReviewSessionComplete',
  component: ReviewSessionComplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#090511]">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col overflow-hidden bg-[#090511]">
          <Story />
        </main>
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
      total: 69,
      correct: 40,
      durationMs: 98000,
      ratings: {
        again: 28,
        hard: 1,
        good: 0,
        easy: 40,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof ReviewSessionComplete>

export const DesktopDueReview: Story = {}

export const MobileDueReview: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

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
    syncError:
      'Часть результатов не сохранилась. Лучше обновить страницу и проверить историю review.',
  },
}
