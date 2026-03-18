import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { getDraftFieldContract, type DraftCandidateInput } from '@/lib/draft-import'
import {
  approveDraftNoteForUser,
  listDraftBatchesForUser,
  listDraftNotesForUser,
  saveDraftNotesForUser,
  type DraftBatchMetadata,
} from '@/lib/draft-import-service'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { Language } from '@/lib/types'

type TypedSupabaseClient = SupabaseClient<Database>
type DeckContractRow = Pick<Database['public']['Tables']['decks']['Row'], 'id' | 'name' | 'language' | 'description'>

function toTextResult(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
    structuredContent,
  }
}

function toToolError(message: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
    isError: true,
  }
}

export function createSrsNinjaMcpServer({
  supabase,
  userId,
}: {
  supabase: TypedSupabaseClient
  userId: string
}) {
  const server = new McpServer({
    name: 'SRS Ninja MCP',
    version: '0.1.0',
  })

  server.registerTool(
    'list_decks',
    {
      title: 'List Decks',
      description: 'List decks available to the current SRS Ninja user.',
      annotations: { readOnlyHint: true },
      outputSchema: {
        decks: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            language: z.string(),
            description: z.string().nullable().optional(),
          })
        ),
      },
    },
    async () => {
      const { data: decks, error } = await supabase
        .from('decks')
        .select('id, name, language, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        return toToolError('Failed to fetch decks.')
      }

      return toTextResult(
        `Found ${(decks ?? []).length} decks.`,
        { decks: (decks ?? []) as Record<string, unknown>[] }
      )
    }
  )

  server.registerTool(
    'get_deck_contract',
    {
      title: 'Get Deck Contract',
      description: 'Return the field contract for a deck so candidate notes match the expected schema.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        deckId: z.string(),
      },
      outputSchema: {
        deck: z.object({
          id: z.string(),
          name: z.string(),
          language: z.string(),
          description: z.string().nullable().optional(),
        }),
        contract: z.object({
          keys: z.array(z.string()),
          requiredKeys: z.array(z.string()),
        }),
      },
    },
    async ({ deckId }) => {
      const { data: deckData, error } = await supabase
        .from('decks')
        .select('id, name, language, description')
        .eq('id', deckId)
        .eq('user_id', userId)
        .single()

      const deck = deckData as DeckContractRow | null

      if (error || !deck) {
        return toToolError('Deck not found.')
      }

      const contract = getDraftFieldContract(deck.language as Language)

      return toTextResult(
        `Deck ${deck.name} uses the ${deck.language} field contract.`,
        {
          deck,
          contract: {
            keys: contract.keys,
            requiredKeys: contract.requiredKeys,
          },
        }
      )
    }
  )

  server.registerTool(
    'save_draft_notes',
    {
      title: 'Save Draft Notes',
      description: 'Save AI-generated note candidates into a deck as drafts grouped by an import batch.',
      inputSchema: {
        deckId: z.string(),
        items: z.array(
          z.object({
            fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
            tags: z.array(z.string()).optional(),
          })
        ),
        metadata: z
          .object({
            modelName: z.string().optional(),
            promptVersion: z.string().optional(),
            topic: z.string().optional(),
            requestedTags: z.array(z.string()).optional(),
            inputPayload: z.record(z.string(), z.unknown()).optional(),
          })
          .optional(),
      },
      outputSchema: {
        batchId: z.string(),
        createdNoteIds: z.array(z.string()),
        skippedItems: z.array(
          z.object({
            index: z.number(),
            reason: z.string(),
          })
        ),
        warnings: z.array(z.string()),
      },
    },
    async ({ deckId, items, metadata }) => {
      try {
        const result = await saveDraftNotesForUser(
          supabase,
          userId,
          deckId,
          items as DraftCandidateInput[],
          (metadata ?? {}) as DraftBatchMetadata
        )

        return toTextResult(
          `Saved ${result.createdNoteIds.length} draft notes.`,
          {
            batchId: result.batchId,
            createdNoteIds: result.createdNoteIds,
            skippedItems: result.skippedItems,
            warnings: result.warnings,
          }
        )
      } catch (error) {
        return toToolError(error instanceof Error ? error.message : 'Failed to save draft notes.')
      }
    }
  )

  server.registerTool(
    'list_draft_batches',
    {
      title: 'List Draft Batches',
      description: 'List draft import batches for the current user.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        deckId: z.string().optional(),
      },
      outputSchema: {
        batches: z.array(
          z.object({
            id: z.string(),
            deck_id: z.string(),
            source: z.string(),
            status: z.string(),
            notes_count: z.number(),
            topic: z.string().nullable().optional(),
            model_name: z.string().nullable().optional(),
          })
        ),
      },
    },
    async ({ deckId }) => {
      const batches = await listDraftBatchesForUser(supabase, userId, deckId)

      return toTextResult(
        `Found ${batches.length} draft batches.`,
        {
          batches: batches.map((batch) => ({
            id: batch.id,
            deck_id: batch.deck_id,
            source: batch.source,
            status: batch.status,
            notes_count: batch.notes_count,
            topic: batch.topic,
            model_name: batch.model_name,
          })),
        }
      )
    }
  )

  server.registerTool(
    'list_draft_notes',
    {
      title: 'List Draft Notes',
      description: 'List draft notes for a deck or import batch.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        deckId: z.string().optional(),
        batchId: z.string().optional(),
      },
      outputSchema: {
        notes: z.array(
          z.object({
            id: z.string(),
            deck_id: z.string(),
            import_batch_id: z.string().nullable(),
            tags: z.array(z.string()),
            fields: z.record(z.string(), z.unknown()),
            created_at: z.string(),
          })
        ),
      },
    },
    async ({ deckId, batchId }) => {
      const notes = await listDraftNotesForUser(supabase, userId, { deckId, batchId })

      return toTextResult(
        `Found ${notes.length} draft notes.`,
        {
          notes: notes.map((note) => ({
            id: note.id,
            deck_id: note.deck_id,
            import_batch_id: note.import_batch_id,
            tags: note.tags ?? [],
            fields: note.fields as Record<string, unknown>,
            created_at: note.created_at,
          })),
        }
      )
    }
  )

  server.registerTool(
    'approve_draft_note',
    {
      title: 'Approve Draft Note',
      description: 'Approve a draft note and publish it into the active review system.',
      inputSchema: {
        noteId: z.string(),
      },
      outputSchema: {
        noteId: z.string(),
        deckId: z.string(),
        importBatchId: z.string().nullable(),
      },
    },
    async ({ noteId }) => {
      try {
        const result = await approveDraftNoteForUser(supabase, userId, noteId)
        return toTextResult(
          `Approved draft note ${result.noteId}.`,
          result
        )
      } catch (error) {
        return toToolError(error instanceof Error ? error.message : 'Failed to approve draft note.')
      }
    }
  )

  return server
}

export async function handleMcpRequest(
  request: Request,
  {
    supabase,
    userId,
  }: {
    supabase: TypedSupabaseClient
    userId: string
  }
) {
  const server = createSrsNinjaMcpServer({ supabase, userId })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  const parsedBody =
    request.method === 'POST'
      ? await request.clone().json().catch(() => undefined)
      : undefined

  return transport.handleRequest(request, { parsedBody })
}
