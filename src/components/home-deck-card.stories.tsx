import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HomeDeckCard } from './home-deck-card'

const meta: Meta<typeof HomeDeckCard> = {
  title: 'Home/HomeDeckCard',
  component: HomeDeckCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[22rem] max-w-full p-4 sm:w-[32rem]">
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

export const NeedsReview: Story = {}

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
