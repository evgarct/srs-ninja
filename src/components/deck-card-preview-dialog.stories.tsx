import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Eye } from 'lucide-react'

import { DeckCardPreviewDialog } from './deck-card-preview-dialog'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof DeckCardPreviewDialog> = {
  title: 'Deck/DeckCardPreviewDialog',
  component: DeckCardPreviewDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="min-h-[640px] p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof DeckCardPreviewDialog>

export const EnglishNote: Story = {
  args: {
    language: 'english',
    triggerLabel: 'Показать карточку',
    audioUrl: 'https://example.com/anchor.mp3',
    fields: {
      word: 'anchor',
      translation: 'якорь',
      examples_html: '<ul><li>Drop the <b>anchor</b> before the storm.</li><li>The <b>anchor</b> held through the night.</li></ul>',
      level: 'A2',
      popularity: '6',
      style: 'neutral',
      part_of_speech: 'noun',
    },
    trigger: (
      <Button variant="ghost" size="icon" title="Показать карточку" aria-label="Показать карточку">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
}

export const CzechNote: Story = {
  args: {
    language: 'czech',
    triggerLabel: 'Показать карточку',
    fields: {
      word: 'konev',
      translation: 'лейка',
      example_sentence: 'Na zahradě jsme použili <b>konev</b>.',
      example_translation: 'В саду мы использовали <b>лейку</b>.',
      level: 'A1',
      popularity: '7',
      style: 'Neutrální',
      part_of_speech: 'podstatné jméno',
      gender: 'ženský',
      note: 'ч. мн.: konve',
    },
    trigger: (
      <Button variant="ghost" size="icon" title="Показать карточку" aria-label="Показать карточку">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
}
