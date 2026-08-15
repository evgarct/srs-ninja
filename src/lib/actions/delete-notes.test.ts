import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient, revalidatePath } = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient }))
vi.mock('next/cache', () => ({ revalidatePath }))

import { deleteNotes } from './notes'

function mockClient(result: { data: Array<{ id: string }> | null; error: Error | null }, userId = 'user-1') {
  const select = vi.fn().mockResolvedValue(result)
  const query = {
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    select,
  }
  query.delete.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.in.mockReturnValue(query)

  const from = vi.fn().mockReturnValue(query)
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }) },
    from,
  })
  return { from, query }
}

describe('deleteNotes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an empty selection before opening a database client', async () => {
    await expect(deleteNotes([], 'deck-1')).rejects.toThrow('No notes selected')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('scopes one bulk delete to the authenticated user and deck', async () => {
    const { query } = mockClient({ data: [{ id: 'note-1' }, { id: 'note-2' }], error: null })

    await expect(deleteNotes(['note-1', 'note-2', 'note-1'], 'deck-1')).resolves.toEqual({
      deletedIds: ['note-1', 'note-2'],
    })
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.eq).toHaveBeenCalledWith('deck_id', 'deck-1')
    expect(query.in).toHaveBeenCalledWith('id', ['note-1', 'note-2'])
    expect(revalidatePath).toHaveBeenCalledWith('/deck/deck-1')
  })

  it('rejects unauthenticated requests', async () => {
    mockClient({ data: [], error: null }, '')
    await expect(deleteNotes(['note-1'], 'deck-1')).rejects.toThrow('Not authenticated')
  })

  it('surfaces database failures without revalidating', async () => {
    mockClient({ data: null, error: new Error('delete failed') })
    await expect(deleteNotes(['note-1'], 'deck-1')).rejects.toThrow('delete failed')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
