import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor, within } from 'storybook/test'

import { HomeDeckList, type HomeDeckListItem } from './home-deck-list'

const MANY_DECKS: HomeDeckListItem[] = [
  {
    deck: {
      id: 'deck-cs',
      name: 'CZ',
      language: 'czech',
      translation_language: 'russian',
    },
    due: 24,
    drafts: 0,
  },
  {
    deck: {
      id: 'deck-en',
      name: 'English',
      language: 'english',
      translation_language: 'russian',
    },
    due: 0,
    drafts: 0,
  },
  {
    deck: {
      id: 'deck-tr',
      name: 'Beginning',
      language: 'turkish',
      translation_language: 'russian',
    },
    due: 0,
    drafts: 0,
  },
  {
    deck: {
      id: 'deck-en-2',
      name: 'Travel English',
      language: 'english',
      translation_language: 'russian',
    },
    due: 5,
    drafts: 0,
  },
  {
    deck: {
      id: 'deck-tr-2',
      name: 'Advanced Turkish',
      language: 'turkish',
      translation_language: 'russian',
    },
    due: 0,
    drafts: 0,
  },
]

const meta: Meta<typeof HomeDeckList> = {
  title: 'Home/HomeDeckList',
  component: HomeDeckList,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'iphone13' },
  },
  args: { deckStats: MANY_DECKS },
  render: (args) => (
    <div className="dark relative h-[667px] overflow-hidden bg-[#080511] text-white">
      <main className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden px-4 pb-[6.25rem] pt-4">
        <HomeDeckList {...args} />
      </main>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 h-16 rounded-full bg-black/80" />
    </div>
  ),
}

export default meta

type Story = StoryObj<typeof HomeDeckList>

export const ScrollableDeckList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const lastDeck = canvas.getByText('Advanced Turkish')
    const [openDeckLink] = canvas.getAllByRole('link', { name: /Открыть/i })
    const firstCard = openDeckLink.closest('[data-slot="card"]')

    expect(firstCard).not.toBeNull()
    expect(openDeckLink.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      firstCard!.getBoundingClientRect().bottom
    )

    await waitFor(() => {
      const currentScrollRegion = canvas.getByTestId('home-deck-scroll-region')
      expect(currentScrollRegion.scrollHeight).toBeGreaterThan(currentScrollRegion.clientHeight)
    })

    const scrollRegion = canvas.getByTestId('home-deck-scroll-region')
    scrollRegion.scrollTo({ top: scrollRegion.scrollHeight })

    await waitFor(() => {
      const scrollBounds = scrollRegion.getBoundingClientRect()
      const deckBounds = lastDeck.getBoundingClientRect()
      expect(deckBounds.bottom).toBeLessThanOrEqual(scrollBounds.bottom)
    })
  },
}
