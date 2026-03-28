import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { DraftConflictPanel } from './draft-conflict-panel'

const meta: Meta<typeof DraftConflictPanel> = {
  title: 'Drafts/DraftConflictPanel',
  component: DraftConflictPanel,
  args: {
    conflict: {
      kind: 'similar_existing_note',
      matchedNoteId: 'note-42',
      matchedPrimaryText: 'anchor',
      similarityScore: 0.86,
      resolution: 'open',
    },
    matchedNote: {
      id: 'note-42',
      fields: {
        word: 'anchor',
        translation: 'якорь',
      },
      tags: ['nautical', 'travel'],
    },
    language: 'english',
    onUpdateExisting: fn(),
    onKeepSeparate: fn(),
    onIgnoreMatch: fn(),
  },
}

export default meta

type Story = StoryObj<typeof DraftConflictPanel>

export const OpenConflict: Story = {}
