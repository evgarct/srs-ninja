import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, expect } from 'storybook/test'

import { HomeDeckCard } from './home-deck-card'

const meta: Meta<typeof HomeDeckCard> = {
  title: 'Home/HomeDeckCard',
  component: HomeDeckCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="dark w-[22rem] max-w-full bg-[#080511] p-4 sm:w-[32rem]">
        <Story />
      </div>
    ),
  ],
  args: {
    deck: {
      id: 'deck-1',
      name: 'English Core',
      language: 'english',
    },
    due: 18,
    drafts: 2,
    completedToday: false,
  },
}

export default meta

type Story = StoryObj<typeof HomeDeckCard>

export const NeedsReview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Deck name is visible
    await canvas.findByText('English Core')
    // "Start review" link is present and points to the correct URL
    const reviewLink = await canvas.findByRole('link', { name: /Начать review/i })
    expect(reviewLink).toHaveAttribute('href', '/decks/deck-1/review')
    // Draft badge visible (drafts: 2)
    await canvas.findByText(/2/)
  },
}

export const CompletedTodayAndIdle: Story = {
  args: {
    due: 0,
    drafts: 0,
    completedToday: true,
  },
}

export const CompletedTodayWithMoreDueWork: Story = {
  args: {
    due: 7,
    drafts: 0,
    completedToday: true,
  },
}

export const IdleBeforeExtraStudy: Story = {
  args: {
    due: 0,
    drafts: 0,
    completedToday: false,
  },
}
