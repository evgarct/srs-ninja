import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getDraftFieldContract, validateDraftCandidate, type DraftCandidateInput } from '@/lib/draft-import'
import type { Language } from '@/lib/types'
import { listDraftBatchesForUser, listDraftNotesForUser, saveDraftNotesForUser, type DraftBatchMetadata } from '@/lib/draft-import-service'
import { addAgentSelectors, hasDeckSelector, MCP_DECK_LANGUAGES, resolveDeck, type DeckSelector, type McpDeck } from '@/lib/mcp-decks'
import { buildDeckContract, buildEchoGuide } from '@/lib/mcp-guide'
import { brand } from '@/lib/brand'

type TypedSupabaseClient = SupabaseClient<Database>
const selectorFields = {
  deckId: z.string().min(1).optional().describe('Deck UUID from list_decks; not needed when language or exact name uniquely identifies the deck.'),
  language: z.enum(MCP_DECK_LANGUAGES).optional().describe('Study language. A unique language selects the deck automatically.'),
  name: z.string().min(1).optional().describe('Exact deck name, compared case-insensitively after trimming whitespace.'),
}

function toTextResult(text: string, structuredContent?: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text }], structuredContent }
}

function toToolError(message: string, structuredContent: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: message }], isError: true, structuredContent }
}

export type ToolErrorDiagnostic = {
  message: string; errorType?: string; code?: string; details?: string; hint?: string; tool?: string; deckId?: string; itemCount?: number
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }

export function buildToolErrorDiagnostic(error: unknown, fallbackMessage: string, context: Omit<ToolErrorDiagnostic, 'message' | 'errorType' | 'code' | 'details' | 'hint'> = {}): ToolErrorDiagnostic {
  const diagnostic: ToolErrorDiagnostic = { message: fallbackMessage, ...context }
  if (error instanceof Error) { diagnostic.message = error.message || fallbackMessage; diagnostic.errorType = error.name }
  if (isRecord(error)) {
    if (typeof error.message === 'string' && error.message.trim()) diagnostic.message = error.message
    if (typeof error.code === 'string' && error.code.trim()) diagnostic.code = error.code
    if (typeof error.details === 'string' && error.details.trim()) diagnostic.details = error.details
    if (typeof error.hint === 'string' && error.hint.trim()) diagnostic.hint = error.hint
    if (!diagnostic.errorType && typeof error.name === 'string') diagnostic.errorType = error.name
  }
  return diagnostic
}

async function getOwnedDecks(supabase: TypedSupabaseClient, userId: string): Promise<McpDeck[]> {
  const { data, error } = await supabase.from('decks').select('id, name, language, translation_language, description').eq('user_id', userId).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as McpDeck[]
}

async function resolveOwnedDeck(supabase: TypedSupabaseClient, userId: string, selector: DeckSelector) {
  const decks = await getOwnedDecks(supabase, userId)
  const resolution = resolveDeck(decks, selector)
  if (!resolution.ok) return { error: toToolError(resolution.message, { code: resolution.code, candidates: addAgentSelectors(resolution.candidates), nextTool: 'list_decks' }) }
  return { deck: resolution.deck }
}

function selectorFromInput(input: { deckId?: string; language?: typeof MCP_DECK_LANGUAGES[number]; name?: string }): DeckSelector {
  return { deckId: input.deckId, language: input.language, name: input.name }
}

export function createEchoMcpServer({ supabase, userId }: { supabase: TypedSupabaseClient; userId: string }) {
  const server = new McpServer({ name: brand.mcp.serverName, version: '0.2.0' })

  server.registerTool('list_decks', {
    title: 'List Echo decks',
    description: 'List only the authenticated user\'s decks. Each result includes a recommended selector; prefer language when isUniqueForLanguage is true.',
    annotations: { readOnlyHint: true },
  }, async () => {
    try {
      const decks = addAgentSelectors(await getOwnedDecks(supabase, userId))
      return toTextResult(`Found ${decks.length} owned decks. Use recommendedSelector in other tools.`, { decks })
    } catch (error) { return toToolError('Failed to list decks.', { code: 'LIST_DECKS_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to list decks.') }) }
  })

  server.registerTool('get_echo_guide', {
    title: 'Explain Echo MCP',
    description: 'Call this first when you need the workflow, available tools, deck selection rules, field schema, or a valid save example. Add a selector to include a specific deck contract.',
    annotations: { readOnlyHint: true }, inputSchema: selectorFields,
  }, async (input) => {
    const selector = selectorFromInput(input)
    if (!hasDeckSelector(selector)) return toTextResult('Echo MCP guide. Select a deck by language, exact name, or deckId to include its contract.', buildEchoGuide())
    const resolved = await resolveOwnedDeck(supabase, userId, selector)
    if (resolved.error) return resolved.error
    return toTextResult(`Echo MCP guide for ${resolved.deck!.name}.`, buildEchoGuide(resolved.deck!))
  })

  server.registerTool('get_deck_contract', {
    title: 'Get a deck field contract',
    description: 'Get required fields, types, exact enum options, instructions, and a valid save example. UUID is optional: use language for a unique language deck, or language plus exact name on ambiguity.',
    annotations: { readOnlyHint: true }, inputSchema: selectorFields,
  }, async (input) => {
    const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input))
    if (resolved.error) return resolved.error
    return toTextResult(`Contract for ${resolved.deck!.name}. Follow it exactly, then save drafts.`, buildDeckContract(resolved.deck!))
  })

  server.registerTool('save_draft_notes', {
    title: 'Save Echo draft notes',
    description: 'Create draft notes only. Select by unique language, exact name, or deckId. Call get_deck_contract first and use exact field keys and enum values. The user approves drafts later in Echo.',
    inputSchema: {
      ...selectorFields,
      items: z.array(z.object({ fields: z.record(z.string(), z.unknown()), tags: z.array(z.string()).optional() })).min(1),
      metadata: z.object({ modelName: z.string().optional(), promptVersion: z.string().optional(), topic: z.string().optional(), requestedTags: z.array(z.string()).optional(), inputPayload: z.record(z.string(), z.unknown()).optional() }).optional(),
    },
  }, async ({ items, metadata, ...input }) => {
    const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input))
    if (resolved.error) return resolved.error
    try {
      const language = resolved.deck!.language as Language
      const fieldContract = getDraftFieldContract(language)
      const validationIssues = items.flatMap((item, index) => {
        const validation = validateDraftCandidate(language, item as DraftCandidateInput)
        return [...validation.errors, ...validation.warnings].map((issue) => {
          const field = issue.field ? fieldContract.fields.find((candidate) => candidate.key === issue.field) : undefined
          return { index, severity: validation.errors.includes(issue) ? 'error' : 'warning', ...issue, expected: field ? { type: field.type, required: field.required ?? false, options: field.options ? [...field.options] : undefined, hint: field.hint } : undefined }
        })
      })
      const result = await saveDraftNotesForUser(supabase, userId, resolved.deck!.id, items as DraftCandidateInput[], (metadata ?? {}) as DraftBatchMetadata)
      return toTextResult(`Saved ${result.createdNoteIds.length} draft notes to ${resolved.deck!.name}. Review them in Echo before publishing.`, { deck: resolved.deck, ...result, validationIssues, reviewRequired: true })
    } catch (error) {
      const diagnostic = buildToolErrorDiagnostic(error, 'Failed to save draft notes.', { tool: 'save_draft_notes', deckId: resolved.deck!.id, itemCount: items.length })
      return toToolError(diagnostic.message, { code: diagnostic.code ?? 'SAVE_DRAFTS_FAILED', diagnostic, nextTool: 'get_deck_contract', example: buildDeckContract(resolved.deck!).saveExample })
    }
  })

  server.registerTool('list_draft_batches', {
    title: 'List Echo draft batches', description: 'List owned draft batches. Omit the selector for all batches, or select a deck without needing its UUID.', annotations: { readOnlyHint: true }, inputSchema: selectorFields,
  }, async (input) => {
    let deckId: string | undefined
    if (hasDeckSelector(selectorFromInput(input))) {
      const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input)); if (resolved.error) return resolved.error; deckId = resolved.deck!.id
    }
    try { const batches = await listDraftBatchesForUser(supabase, userId, deckId); return toTextResult(`Found ${batches.length} draft batches.`, { batches }) }
    catch (error) { return toToolError('Failed to list draft batches.', { code: 'LIST_DRAFT_BATCHES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to list draft batches.') }) }
  })

  server.registerTool('list_draft_notes', {
    title: 'List Echo draft notes', description: 'List owned draft notes by optional deck selector or batchId. This tool cannot approve or publish notes.', annotations: { readOnlyHint: true }, inputSchema: { ...selectorFields, batchId: z.string().min(1).optional() },
  }, async ({ batchId, ...input }) => {
    let deckId: string | undefined
    if (hasDeckSelector(selectorFromInput(input))) {
      const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input)); if (resolved.error) return resolved.error; deckId = resolved.deck!.id
    }
    try { const notes = await listDraftNotesForUser(supabase, userId, { deckId, batchId }); return toTextResult(`Found ${notes.length} draft notes. Approval remains in Echo.`, { notes }) }
    catch (error) { return toToolError('Failed to list draft notes.', { code: 'LIST_DRAFT_NOTES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to list draft notes.') }) }
  })

  return server
}

export async function handleMcpRequest(request: Request, context: { supabase: TypedSupabaseClient; userId: string }) {
  const server = createEchoMcpServer(context)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  const parsedBody = request.method === 'POST' ? await request.clone().json().catch(() => undefined) : undefined
  return transport.handleRequest(request, { parsedBody })
}
