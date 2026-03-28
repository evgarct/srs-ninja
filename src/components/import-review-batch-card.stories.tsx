import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ImportReviewBatchCard } from '@/components/import-review-batch-card'

const meta: Meta<typeof ImportReviewBatchCard> = {
  title: 'Import/ImportReviewBatchCard',
  component: ImportReviewBatchCard,
  args: {
    id: 'batch-1',
    deckId: 'deck-1',
    deckName: 'English',
    topic: 'Travel vocabulary from airport signs and check-in dialogs',
    createdAt: '2026-03-28T10:00:00.000Z',
    updatedAt: '2026-03-28T10:40:00.000Z',
    source: 'mcp_ai_import',
    modelName: 'GPT-5.4 Thinking',
    draftCount: 7,
    status: 'draft',
    showDelete: true,
  },
}

export default meta

type Story = StoryObj<typeof ImportReviewBatchCard>

export const Default: Story = {}

export const PartiallyApproved: Story = {
  args: {
    deckName: 'CZ',
    topic: 'Single Czech verb batch being reviewed deck by deck',
    draftCount: 2,
    status: 'partially_approved',
    showDelete: false,
  },
}
