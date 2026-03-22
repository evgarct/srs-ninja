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
    mode: 'menu',
  },
}

export default meta

type Story = StoryObj<typeof ExtraStudyBox>

export const CompletedTodayMenu: Story = {}

export const DirectStart: Story = {
  args: {
    mode: 'direct',
  },
}
