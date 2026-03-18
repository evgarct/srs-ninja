import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

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
}
