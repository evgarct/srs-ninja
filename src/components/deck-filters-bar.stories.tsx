import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { within, userEvent } from 'storybook/test'

import { DeckFiltersBar } from './deck-filters-bar'
import type { AudioFilter, FsrsState } from '@/lib/deck-notes'

function InteractiveDeckFiltersBar() {
  const [tagQuery, setTagQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>(['ENGLISH::travel'])
  const [activeStates, setActiveStates] = useState<FsrsState[]>(['learning'])
  const [activeAudioFilter, setActiveAudioFilter] = useState<AudioFilter>('without_audio')

  function toggleTag(tag: string) {
    setActiveTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    )
  }

  function toggleState(state: FsrsState) {
    setActiveStates((current) =>
      current.includes(state)
        ? current.filter((entry) => entry !== state)
        : [...current, state]
    )
  }

  return (
    <div className="w-full max-w-4xl p-6">
      <DeckFiltersBar
        deckLanguage="english"
        availableTags={[
          'ENGLISH::travel',
          'ENGLISH::food',
          'ENGLISH::phrasal-verbs',
          'advanced',
          'basics',
        ]}
        tagQuery={tagQuery}
        activeTags={activeTags}
        activeStates={activeStates}
        activeAudioFilter={activeAudioFilter}
        fsrsFilters={['new', 'learning', 'relearning', 'review']}
        onTagQueryChange={setTagQuery}
        onClearTagSearchAndFilter={() => {
          setTagQuery('')
          setActiveTags([])
        }}
        onResetTags={() => setActiveTags([])}
        onToggleTag={toggleTag}
        onResetStates={() => setActiveStates([])}
        onToggleState={toggleState}
        onAudioFilterChange={setActiveAudioFilter}
      />
    </div>
  )
}

const meta: Meta<typeof DeckFiltersBar> = {
  title: 'Deck/DeckFiltersBar',
  component: DeckFiltersBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta

type Story = StoryObj<typeof DeckFiltersBar>

export const Interactive: Story = {
  render: () => <InteractiveDeckFiltersBar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Open the Tags dropdown — initially shows the active tag ("travel")
    const tagsTrigger = await canvas.findByRole('button', { name: /Tags:/i })
    await userEvent.click(tagsTrigger)
    // Dropdown renders in a portal
    const body = within(document.body)
    // All available tags are visible inside the dropdown
    await body.findByText('Все теги')
    await body.findByText('travel')   // ENGLISH::travel stripped to "travel"
    await body.findByText('food')
    await body.findByText('phrasal-verbs')
    // Toggle the "food" tag (adds it to active list)
    await userEvent.click(await body.findByText('food'))
    // Close by clicking the trigger again (toggles the dropdown closed)
    await userEvent.click(tagsTrigger)
    // Trigger now shows "2 tags" (travel + food)
    await canvas.findByRole('button', { name: /Tags: 2 tags/i })
  },
}
