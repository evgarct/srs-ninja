import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DraftStatusBadge } from './draft-status-badge'

const meta: Meta<typeof DraftStatusBadge> = {
  title: 'Drafts/DraftStatusBadge',
  component: DraftStatusBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof DraftStatusBadge>

export const Draft: Story = {
  args: {
    status: 'draft',
  },
}

export const PartiallyApproved: Story = {
  args: {
    status: 'partially_approved',
  },
}

export const Approved: Story = {
  args: {
    status: 'approved',
  },
}

export const Archived: Story = {
  args: {
    status: 'archived',
  },
}
