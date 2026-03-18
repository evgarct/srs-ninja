import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DeckStatusBadge } from './deck-status-badge'

const meta: Meta<typeof DeckStatusBadge> = {
  title: 'Deck/DeckStatusBadge',
  component: DeckStatusBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof DeckStatusBadge>

export const New: Story = {
  args: {
    state: 'new',
    memoryScore: 16,
  },
}

export const Learning: Story = {
  args: {
    state: 'learning',
    memoryScore: 51,
  },
}

export const Relearning: Story = {
  args: {
    state: 'relearning',
    memoryScore: 34,
  },
}

export const Review: Story = {
  args: {
    state: 'review',
    memoryScore: 88,
  },
}

export const WithoutPercentage: Story = {
  args: {
    state: 'learning',
    memoryScore: null,
  },
}
