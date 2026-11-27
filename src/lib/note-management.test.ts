import { describe, expect, it } from 'vitest'
import { applyTagEdit, filterManagedNotes, noteMatchesQuery, prepareNoteUpdate, toManagedNote, type ManagedNoteRow } from '@/lib/note-management'

describe('applyTagEdit', () => {
  it('adds and removes tags case-insensitively without duplicates', () => {
    expect(applyTagEdit(['lesson-1', 'Nouns'], { addTags: ['nouns', 'rukodělné práce'], removeTags: ['LESSON-1'] })).toEqual(['Nouns', 'rukodělné práce'])
  })

  it('replaces with setTags before applying add/remove', () => {
    expect(applyTagEdit(['old'], { setTags: ['a', 'b'], addTags: ['c'], removeTags: ['a'] })).toEqual(['b', 'c'])
  })
})

describe('prepareNoteUpdate', () => {
  const existing = { fields: { word: 'nůžky', translation: 'ножницы', part_of_speech: 'noun' }, tags: ['craft'] }

  it('merges a partial field patch and keeps untouched fields', () => {
    const result = prepareNoteUpdate('czech', existing, { fields: { translation: 'ножницы (мн.)' } })
    expect(result.errors).toEqual([])
    expect(result.fields).toMatchObject({ word: 'nůžky', translation: 'ножницы (мн.)' })
    expect(result.tags).toEqual(['craft'])
    expect(result.primaryTextChanged).toBe(false)
  })

  it('reports a changed primary text so approved notes regenerate audio', () => {
    expect(prepareNoteUpdate('czech', existing, { fields: { word: 'jehla' } }).primaryTextChanged).toBe(true)
  })

  it('rejects clearing the primary word', () => {
    const result = prepareNoteUpdate('czech', existing, { fields: { word: '' } })
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects an invalid enum value in the patched field only', () => {
    const result = prepareNoteUpdate('czech', existing, { fields: { part_of_speech: 'not-a-pos' } })
    expect(result.errors.map((issue) => issue.field)).toContain('part_of_speech')
  })

  it('edits tags only without validating fields', () => {
    const result = prepareNoteUpdate('czech', { fields: {}, tags: ['a'] }, { addTags: ['b'] })
    expect(result.errors).toEqual([])
    expect(result.tags).toEqual(['a', 'b'])
  })
})

describe('note listing', () => {
  const notes: ManagedNoteRow[] = [
    { id: 'n1', deck_id: 'd', status: 'approved', fields: { word: 'Šicí stroj', translation: 'швейная машина' }, tags: ['Rukodělné práce'], import_batch_id: null, cards: [{ id: 'c1', card_type: 'production', state: 'review' }] },
    { id: 'n2', deck_id: 'd', status: 'approved', fields: { word: 'jehla', translation: 'игла' }, tags: ['other'], import_batch_id: null, cards: [{ id: 'c2', card_type: 'production', state: 'new' }] },
    { id: 'n3', deck_id: 'd', status: 'draft', fields: { word: 'nit', translation: 'нитка' }, tags: ['rukodělné práce'], import_batch_id: 'b1', cards: [] },
  ]

  it('matches a text query ignoring case and diacritics', () => {
    expect(noteMatchesQuery(notes[0].fields, 'sici')).toBe(true)
    expect(noteMatchesQuery(notes[0].fields, 'игла')).toBe(false)
  })

  it('filters by tags case-insensitively and by FSRS state', () => {
    expect(filterManagedNotes(notes, { tags: ['rukodělné PRÁCE'] }).map((note) => note.id)).toEqual(['n1', 'n3'])
    expect(filterManagedNotes(notes, { states: ['new'] }).map((note) => note.id)).toEqual(['n2'])
  })

  it('shapes drafts without a memory state', () => {
    expect(toManagedNote(notes[2])).toMatchObject({ noteId: 'n3', status: 'draft', state: null, primaryText: 'nit', importBatchId: 'b1' })
    expect(toManagedNote(notes[0]).cards).toEqual([{ cardId: 'c1', direction: 'production', state: 'review', dueAt: null }])
  })
})
