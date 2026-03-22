import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ExtraStudyBox } from './extra-study-box'

const meta: Meta<typeof ExtraStudyBox> = {
  title: 'Review/ExtraStudyBox',
  component: ExtraStudyBox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[22rem] max-w-full p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    deckId: 'deck-1',
  },
}

export default meta

type Story = StoryObj<typeof ExtraStudyBox>

export const SuggestedWhenIdle: Story = {}

export const CollapsedAfterStudyingToday: Story = {
  args: {
    hasStudiedToday: true,
  },
}
