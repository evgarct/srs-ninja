export type FsrsState = 'new' | 'learning' | 'relearning' | 'review'

export type DeckNoteCard = {
  id: string
  card_type: string
  state: string
  due_at?: string
  stability?: number
  difficulty?: number
  reps?: number
}

export type DeckNoteRow = {
  id: string
  fields: Record<string, unknown>
  tags: string[]
  cards: DeckNoteCard[]
}

export interface DeckNoteFilters {
  tagFilters?: string[]
  stateFilters?: FsrsState[]
}

const FSRS_STATE_PRIORITY: FsrsState[] = ['relearning', 'learning', 'new', 'review']

export function isFsrsState(value: string): value is FsrsState {
  return FSRS_STATE_PRIORITY.includes(value as FsrsState)
}

export function getNoteFsrsState(cards: DeckNoteCard[]): FsrsState {
  const states = cards.map((card) => card.state).filter(isFsrsState)

  for (const state of FSRS_STATE_PRIORITY) {
    if (states.includes(state)) return state
  }

  return 'new'
}

export function getAllDeckTags(notes: DeckNoteRow[]) {
  return [...new Set(notes.flatMap((note) => note.tags).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}

export function filterDeckNotes(notes: DeckNoteRow[], filters: DeckNoteFilters) {
  const activeTags = new Set(filters.tagFilters ?? [])
  const activeStates = new Set(filters.stateFilters ?? [])

  return notes.filter((note) => {
    const matchesTags =
      activeTags.size === 0 || [...activeTags].every((tag) => note.tags.includes(tag))

    const matchesState =
      activeStates.size === 0 || activeStates.has(getNoteFsrsState(note.cards))

    return matchesTags && matchesState
  })
}

export function getFsrsStateLabel(state: FsrsState) {
  switch (state) {
    case 'new':
      return 'New'
    case 'learning':
      return 'Learning'
    case 'relearning':
      return 'Relearning'
    case 'review':
      return 'Review'
  }
}

export function getFsrsStateTone(state: FsrsState) {
  switch (state) {
    case 'new':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'learning':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'relearning':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'review':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
}

export function getNoteMemoryScore(cards: DeckNoteCard[]) {
  if (cards.length === 0) return null

  const scores = cards.map((card) => {
    const state = isFsrsState(card.state) ? card.state : 'new'
    const stability = Math.max(0, card.stability ?? 0)

    const baseScore =
      state === 'review' ? 72 :
      state === 'learning' ? 46 :
      state === 'relearning' ? 30 :
      16

    const stabilityBoost = Math.min(stability, 30) / 30 * 22
    return Math.round(Math.min(98, baseScore + stabilityBoost))
  })

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}
