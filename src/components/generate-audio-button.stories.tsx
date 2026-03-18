import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'

import { GenerateAudioButton } from './generate-audio-button'

const meta: Meta<typeof GenerateAudioButton> = {
  title: 'Deck/GenerateAudioButton',
  component: GenerateAudioButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    deckId: 'deck-1',
    noteIds: ['note-1', 'note-2', 'note-3'],
    pendingCount: 3,
    onComplete: fn(),
  },
}

export default meta

type Story = StoryObj<typeof GenerateAudioButton>

export const Idle: Story = {}

export const DisabledWhenNothingToGenerate: Story = {
  args: {
    noteIds: [],
    pendingCount: 0,
  },
}

export const Loading: Story = {
  args: {
    stateOverride: 'loading',
  },
}

export const Done: Story = {
  args: {
    stateOverride: 'done',
    resultOverride: {
      total: 3,
      generated: 3,
      skipped: 0,
      errors: 0,
    },
  },
}

export const Error: Story = {
  args: {
    stateOverride: 'error',
  },
}
