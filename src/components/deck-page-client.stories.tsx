import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { userEvent, within } from 'storybook/test'

import { DeckPageClient } from './deck-page-client'

const notes = [
  { id: 'note-1', fields: { word: 'anchor', translation: 'якорь' }, tags: ['travel'], cards: [{ id: 'card-1', card_type: 'recognition', state: 'learning', stability: 4 }] },
  { id: 'note-2', fields: { word: 'harbor', translation: 'гавань' }, tags: ['travel'], cards: [{ id: 'card-2', card_type: 'recognition', state: 'review', stability: 18 }] },
]

const meta: Meta<typeof DeckPageClient> = {
  title: 'Deck/DeckPage',
  component: DeckPageClient,
  parameters: { layout: 'fullscreen', nextjs: { navigation: { pathname: '/deck/deck-1' } } },
  args: { deckId: 'deck-1', deckName: 'English travel', deckLanguage: 'english', dueCards: 1, totalCards: 2, totalNotes: 2, draftNotes: 0, initialNotes: notes, initialAudioMap: {} },
}

export default meta
type Story = StoryObj<typeof DeckPageClient>

export const Default: Story = {}

export const AllVisibleSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Выбрать все показанные ноты' }))
    await canvas.findByRole('button', { name: /Удалить \(2\)/ })
  },
}

export const MobileSelection: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Выбрать anchor' }))
    await canvas.findByRole('button', { name: /Удалить \(1\)/ })
  },
}
