import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ReviewSession } from '@/components/review-session'
import type { ReviewSessionCard } from '@/lib/review-session'

const sampleCards: ReviewSessionCard[] = [
  {
    id: 'card-1',
    note_id: 'note-1',
    card_type: 'recognition',
    state: 'review',
    stability: 18,
    difficulty: 4.7,
    elapsed_days: 5,
    scheduled_days: 9,
    reps: 8,
    lapses: 1,
    due_at: new Date().toISOString(),
    last_review: new Date().toISOString(),
    notes: {
      deck_id: 'deck-1',
      tags: ['travel', 'noun'],
      fields: {
        expression: 'cauldron',
        translation: 'witches’ pot',
        examples_html: '<ul><li>The witch stirred the <b>cauldron</b> slowly.</li><li>Smoke rose from the <b>cauldron</b> in the corner.</li></ul>',
        level: 'B1',
        part_of_speech: 'noun',
        popularity: 4,
        style: 'Neutral / fantasy object',
      },
    },
  },
  {
    id: 'card-2',
    note_id: 'note-2',
    card_type: 'production',
    state: 'review',
    stability: 11,
    difficulty: 5.2,
    elapsed_days: 3,
    scheduled_days: 7,
    reps: 5,
    lapses: 1,
    due_at: new Date().toISOString(),
    last_review: new Date().toISOString(),
    notes: {
      deck_id: 'deck-1',
      tags: ['travel', 'verb'],
      fields: {
        expression: 'to linger',
        translation: 'to stay a little longer',
        examples_html: '<ul><li>We <b>lingered</b> outside the station after the rain stopped.</li><li>She <b>lingered</b> on the final sentence before answering.</li></ul>',
        level: 'B2',
        part_of_speech: 'verb',
        popularity: 5,
        style: 'Neutral',
      },
    },
  },
]

const meta: Meta<typeof ReviewSession> = {
  title: 'Review/ReviewSession',
  component: ReviewSession,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  args: {
    deckId: 'deck-1',
    language: 'english',
    cards: sampleCards,
  },
}

export default meta

type Story = StoryObj<typeof ReviewSession>

export const Desktop: Story = {
  render: (args) => (
    <div className="min-h-screen bg-[#dedede] p-4">
      <main className="mx-auto flex h-[calc(100svh-2rem)] w-full flex-col overflow-hidden bg-[#dedede] px-3 pb-0 pt-0 sm:px-4">
        <ReviewSession {...args} />
      </main>
    </div>
  ),
}

export const Mobile: Story = {
  ...Desktop,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
