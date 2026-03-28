import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanupEmptyImportBatchesForUser } from '@/lib/draft-import-service'

type DraftStatus = 'draft' | 'approved'

type NoteRecord = {
  import_batch_id: string | null
  status: DraftStatus
}

type MockQueryState = {
  filters: Record<string, unknown>
  inFilter?: {
    column: string
    values: unknown[]
  }
}

class MockQuery<Result> implements PromiseLike<Result> {
  private state: MockQueryState = { filters: {} }

  constructor(private readonly execute: (state: MockQueryState) => Result | Promise<Result>) {}

  eq(column: string, value: unknown) {
    this.state.filters[column] = value
    return this
  }

  in(column: string, values: unknown[]) {
    this.state.inFilter = { column, values }
    return this
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute(this.state)).then(onfulfilled, onrejected)
  }
}

function createCleanupSupabaseMock(input: {
  userId: string
  batchIds: string[]
  notes: NoteRecord[]
}) {
  const noteChunkCalls: string[][] = []
  const deleteChunkCalls: string[][] = []

  const client = {
    from(table: string) {
      if (table === 'import_batches') {
        return {
          select() {
            return new MockQuery(async (state) => {
              expect(state.filters.user_id).toBe(input.userId)
              return {
                data: input.batchIds.map((id) => ({ id })),
                error: null,
              }
            })
          },
          delete() {
            return new MockQuery(async (state) => {
              expect(state.filters.user_id).toBe(input.userId)
              expect(state.inFilter?.column).toBe('id')
              const chunk = (state.inFilter?.values as string[]) ?? []
              deleteChunkCalls.push(chunk)
              return { error: null }
            })
          },
        }
      }

      if (table === 'notes') {
        return {
          select() {
            return new MockQuery(async (state) => {
              expect(state.filters.user_id).toBe(input.userId)
              expect(state.inFilter?.column).toBe('import_batch_id')
              const chunk = (state.inFilter?.values as string[]) ?? []
              noteChunkCalls.push(chunk)
              return {
                data: input.notes.filter(
                  (note) => note.import_batch_id && chunk.includes(note.import_batch_id)
                ),
                error: null,
              }
            })
          },
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  } as unknown as SupabaseClient

  return { client, noteChunkCalls, deleteChunkCalls }
}

describe('cleanupEmptyImportBatchesForUser', () => {
  it('chunks note and delete queries to avoid oversized in-filters', async () => {
    const userId = 'user-1'
    const batchIds = Array.from({ length: 205 }, (_, index) => `batch-${index + 1}`)
    const notes: NoteRecord[] = [
      { import_batch_id: 'batch-1', status: 'draft' },
      { import_batch_id: 'batch-2', status: 'approved' },
    ]
    const { client, noteChunkCalls, deleteChunkCalls } = createCleanupSupabaseMock({
      userId,
      batchIds,
      notes,
    })

    const deletedCount = await cleanupEmptyImportBatchesForUser(client, userId)

    expect(deletedCount).toBe(204)
    expect(noteChunkCalls).toHaveLength(3)
    expect(noteChunkCalls.map((chunk) => chunk.length)).toEqual([100, 100, 5])
    expect(deleteChunkCalls).toHaveLength(3)
    expect(deleteChunkCalls.map((chunk) => chunk.length)).toEqual([100, 100, 4])
    expect(deleteChunkCalls.flat()).not.toContain('batch-1')
  })
})
