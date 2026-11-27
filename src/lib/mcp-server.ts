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
import { orderCards } from '@/lib/card-ordering'
import { REGULAR_DUE_REVIEW_LIMIT } from '@/lib/review-config'
import { buildReviewCardSides, type ReviewDirection } from '@/lib/review-answer-variants'
import { getDueCardsForUser, getManualStudyCardsForUser, parseReviewRating, submitReviewForUser } from '@/lib/review-service'
import {
  approveDraftsForUser,
  deleteNotesForUser,
  editNoteTagsForUser,
  getNoteForUser,
  listNotesForUser,
  resolveDraftConflictsForUser,
  resolveNoteIdsForUser,
  updateNotesForUser,
  type ItemResult,
} from '@/lib/note-management-service'
import { hasTagEdit } from '@/lib/note-management'
import { deleteDraftBatchForUser } from '@/lib/draft-import-service'

type TypedSupabaseClient = SupabaseClient<Database>
const selectorFields = {
  deckId: z.string().min(1).optional().describe('Deck UUID from list_decks; not needed when language or exact name uniquely identifies the deck.'),
  language: z.enum(MCP_DECK_LANGUAGES).optional().describe('Study language. A unique language selects the deck automatically.'),
  name: z.string().min(1).optional().describe('Exact deck name, compared case-insensitively after trimming whitespace.'),
}

// Some MCP clients (including Claude) only show the text content to the model
// and drop structuredContent, so the payload is mirrored into the text as JSON.
// Without it get_review_session returned only a summary line and no cardIds.
function withJsonPayload(text: string, structuredContent?: Record<string, unknown>) {
  return structuredContent ? `${text}\n\n${JSON.stringify(structuredContent)}` : text
}

export function toTextResult(text: string, structuredContent?: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: withJsonPayload(text, structuredContent) }], structuredContent }
}

export function toToolError(message: string, structuredContent: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: withJsonPayload(message, structuredContent) }], isError: true, structuredContent }
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

const tagEditFields = {
  setTags: z.array(z.string()).optional().describe('Replace all tags with this list (applied first).'),
  addTags: z.array(z.string()).optional().describe('Tags to add.'),
  removeTags: z.array(z.string()).optional().describe('Tags to remove (case-insensitive).'),
}

function summarizeItems(results: ItemResult[]) {
  const failed = results.filter((result) => !result.ok)
  return { updated: results.length - failed.length, failed: failed.length, results }
}

function selectorFromInput(input: { deckId?: string; language?: typeof MCP_DECK_LANGUAGES[number]; name?: string }): DeckSelector {
  return { deckId: input.deckId, language: input.language, name: input.name }
}

export function createEchoMcpServer({ supabase, userId }: { supabase: TypedSupabaseClient; userId: string }) {
  const server = new McpServer({ name: brand.mcp.serverName, version: '0.4.0' })

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
    description: 'Create draft notes. Select by unique language, exact name, or deckId. Call get_deck_contract first and use exact field keys and enum values. To change existing notes use update_notes or edit_note_tags instead of saving duplicates. Drafts are published in Echo or with approve_drafts when the user asks.',
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
    title: 'List Echo draft notes', description: 'List owned draft notes by optional deck selector or batchId. Edit them with update_notes or edit_note_tags, publish with approve_drafts.', annotations: { readOnlyHint: true }, inputSchema: { ...selectorFields, batchId: z.string().min(1).optional() },
  }, async ({ batchId, ...input }) => {
    let deckId: string | undefined
    if (hasDeckSelector(selectorFromInput(input))) {
      const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input)); if (resolved.error) return resolved.error; deckId = resolved.deck!.id
    }
    try { const notes = await listDraftNotesForUser(supabase, userId, { deckId, batchId }); return toTextResult(`Found ${notes.length} draft notes.`, { notes }) }
    catch (error) { return toToolError('Failed to list draft notes.', { code: 'LIST_DRAFT_NOTES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to list draft notes.') }) }
  })

  server.registerTool('list_notes', {
    title: 'List Echo notes',
    description: 'List notes of one deck with their fields, tags, memory state and cards. status "approved" (default) lists published notes, "draft" drafts, "all" both. Filter by tags (all must match), FSRS states, or a text query matched against any field ignoring case and diacritics. Paginate with offset/limit.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      ...selectorFields,
      status: z.enum(['approved', 'draft', 'all']).default('approved'),
      tags: z.array(z.string().min(1)).optional(),
      states: z.array(z.enum(['new', 'learning', 'relearning', 'review'])).optional(),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    },
  }, async ({ status, tags, states, query, limit, offset, ...input }) => {
    const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input))
    if (resolved.error) return resolved.error
    try {
      const result = await listNotesForUser(supabase, userId, resolved.deck!.id, { status, tags, states, query, limit, offset })
      return toTextResult(`Found ${result.total} matching notes in ${resolved.deck!.name}; returned ${result.notes.length} from offset ${offset}.`, { deck: { id: resolved.deck!.id, name: resolved.deck!.name, language: resolved.deck!.language }, ...result })
    } catch (error) { return toToolError('Failed to list notes.', { code: 'LIST_NOTES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to list notes.', { tool: 'list_notes' }) }) }
  })

  server.registerTool('get_note', {
    title: 'Get one Echo note', description: 'Get one owned note (draft or approved) with fields, tags, memory state and cards.', annotations: { readOnlyHint: true },
    inputSchema: { noteId: z.string().min(1) },
  }, async ({ noteId }) => {
    try { const note = await getNoteForUser(supabase, userId, noteId); return toTextResult(`Note ${note.primaryText} (${note.status}).`, { note }) }
    catch (error) { return toToolError('Failed to load the note.', { code: 'GET_NOTE_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to load the note.', { tool: 'get_note' }) }) }
  })

  server.registerTool('update_notes', {
    title: 'Edit Echo notes',
    description: 'Edit drafts or approved notes, up to 200 per call. fields is a partial patch merged into the stored fields (use exact keys and enum values from get_deck_contract; an empty string clears a field). Tags: setTags replaces, then addTags/removeTags apply. Approved notes keep their cards and review history; their audio is regenerated when the word changes, like the web editor. Each item reports ok or an error.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      items: z.array(z.object({ noteId: z.string().min(1), fields: z.record(z.string(), z.unknown()).optional(), ...tagEditFields })).min(1).max(200),
    },
  }, async ({ items }) => {
    if (items.some((item) => !item.fields && !hasTagEdit(item))) return toToolError('Each item needs fields or a tag change.', { code: 'EMPTY_UPDATE' })
    try {
      const summary = summarizeItems(await updateNotesForUser(supabase, userId, items))
      return toTextResult(`Updated ${summary.updated} notes, ${summary.failed} failed.`, summary)
    } catch (error) { return toToolError('Failed to update notes.', { code: 'UPDATE_NOTES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to update notes.', { tool: 'update_notes', itemCount: items.length }) }) }
  })

  server.registerTool('edit_note_tags', {
    title: 'Edit tags on many Echo notes',
    description: 'Change tags on many notes at once, drafts or approved. Select notes by noteIds or by batchId (every note of that draft batch). setTags replaces, then addTags/removeTags apply.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    inputSchema: { noteIds: z.array(z.string().min(1)).max(500).optional(), batchId: z.string().min(1).optional(), ...tagEditFields },
  }, async ({ noteIds, batchId, ...edit }) => {
    if (!noteIds?.length && !batchId) return toToolError('Pass noteIds or batchId.', { code: 'SELECTION_REQUIRED', nextTool: 'list_draft_batches' })
    if (!hasTagEdit(edit)) return toToolError('Pass setTags, addTags or removeTags.', { code: 'EMPTY_TAG_EDIT' })
    try {
      const ids = await resolveNoteIdsForUser(supabase, userId, { noteIds, batchId })
      if (!ids.length) return toToolError('No notes matched the selection.', { code: 'NO_NOTES', batchId })
      const summary = summarizeItems(await editNoteTagsForUser(supabase, userId, ids, edit))
      return toTextResult(`Updated tags on ${summary.updated} notes, ${summary.failed} failed.`, summary)
    } catch (error) { return toToolError('Failed to edit tags.', { code: 'EDIT_TAGS_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to edit tags.', { tool: 'edit_note_tags' }) }) }
  })

  server.registerTool('approve_drafts', {
    title: 'Approve Echo drafts',
    description: 'Publish drafts so they become study cards, exactly like Approve in Echo. Pass noteIds, or batchId to approve every draft of a batch. Drafts with an open similar-note conflict are skipped until resolve_draft_conflict. Only approve when the user asked for it.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: { noteIds: z.array(z.string().min(1)).max(500).optional(), batchId: z.string().min(1).optional() },
  }, async ({ noteIds, batchId }) => {
    if (!noteIds?.length && !batchId) return toToolError('Pass noteIds or batchId.', { code: 'SELECTION_REQUIRED', nextTool: 'list_draft_batches' })
    try {
      const result = await approveDraftsForUser(supabase, userId, { noteIds, batchId })
      if ('results' in result) {
        const summary = summarizeItems(result.results)
        return toTextResult(`Approved ${summary.updated} drafts, ${summary.failed} failed.`, summary)
      }
      return toTextResult(`Approved ${result.approvedNoteIds.length} drafts; ${result.skippedNoteIds.length} skipped because of open conflicts.`, { ...result })
    } catch (error) { return toToolError('Failed to approve drafts.', { code: 'APPROVE_DRAFTS_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to approve drafts.', { tool: 'approve_drafts' }) }) }
  })

  server.registerTool('resolve_draft_conflict', {
    title: 'Resolve a similar-note conflict',
    description: 'A draft with draft_conflict.resolution "open" resembles an existing note. kept_separate keeps both, ignored dismisses the warning, apply_to_existing copies the draft fields into the existing note, merges tags and deletes the draft. Same actions as the drafts screen in Echo.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    inputSchema: { noteId: z.string().min(1), resolution: z.enum(['kept_separate', 'ignored', 'apply_to_existing']) },
  }, async ({ noteId, resolution }) => {
    try { const result = await resolveDraftConflictsForUser(supabase, userId, noteId, resolution); return toTextResult(`Conflict resolved: ${resolution}.`, { ...result, resolution }) }
    catch (error) { return toToolError('Failed to resolve the conflict.', { code: 'RESOLVE_CONFLICT_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to resolve the conflict.', { tool: 'resolve_draft_conflict' }) }) }
  })

  server.registerTool('delete_notes', {
    title: 'Delete Echo notes',
    description: 'Permanently delete notes by noteIds. Drafts are removed from their batch; approved notes are deleted with their cards and review history, which cannot be undone. Requires confirm: true; only call after the user explicitly asked to delete these notes.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    inputSchema: { noteIds: z.array(z.string().min(1)).min(1).max(500), confirm: z.literal(true).describe('Must be true: the user confirmed this deletion.') },
  }, async ({ noteIds }) => {
    try {
      const summary = summarizeItems(await deleteNotesForUser(supabase, userId, noteIds))
      return toTextResult(`Deleted ${summary.updated} notes, ${summary.failed} failed.`, summary)
    } catch (error) { return toToolError('Failed to delete notes.', { code: 'DELETE_NOTES_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to delete notes.', { tool: 'delete_notes' }) }) }
  })

  server.registerTool('delete_draft_batch', {
    title: 'Delete an Echo draft batch',
    description: 'Delete a draft batch and all its drafts. Refused when any note of the batch is already approved. Requires confirm: true after the user asked for it.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    inputSchema: { batchId: z.string().min(1), confirm: z.literal(true).describe('Must be true: the user confirmed this deletion.') },
  }, async ({ batchId }) => {
    try { const result = await deleteDraftBatchForUser(supabase, userId, batchId); return toTextResult('Draft batch deleted.', { ...result }) }
    catch (error) { return toToolError('Failed to delete the draft batch.', { code: 'DELETE_DRAFT_BATCH_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to delete the draft batch.', { tool: 'delete_draft_batch' }) }) }
  })

  server.registerTool('get_review_session', {
    title: 'Get an Echo review session',
    description: 'Load cards to review out loud. mode "due" returns today\'s due cards ordered like the app; mode "tag" returns cards of notes with all given tags regardless of due date. Default direction "production" asks the Russian side and expects the target-language answer. Grade each card with submit_review right after the user answers.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      ...selectorFields,
      mode: z.enum(['due', 'tag']).default('due'),
      tags: z.array(z.string().min(1)).optional().describe('Required for mode "tag"; a note must have every tag.'),
      direction: z.enum(['production', 'recognition', 'both']).default('production').describe('production: RU question, target-language answer. recognition: target-language question, RU answer.'),
      limit: z.number().int().min(1).max(100).default(30),
    },
  }, async ({ mode, tags, direction, limit, ...input }) => {
    const resolved = await resolveOwnedDeck(supabase, userId, selectorFromInput(input))
    if (resolved.error) return resolved.error
    const deck = resolved.deck!
    if (mode === 'tag' && !tags?.length) return toToolError('mode "tag" needs at least one tag.', { code: 'TAGS_REQUIRED', nextTool: 'get_review_session' })

    try {
      const language = deck.language as Language
      const matchesDirection = (card: { card_type: string }) =>
        direction === 'both' ? card.card_type === 'production' || card.card_type === 'recognition' : card.card_type === direction

      const rawCards = mode === 'tag'
        ? await getManualStudyCardsForUser(supabase, deck.id, { tags }, userId)
        : await getDueCardsForUser(supabase, deck.id, REGULAR_DUE_REVIEW_LIMIT, userId)
      const candidates = rawCards.filter(matchesDirection)
      const selected = (mode === 'tag' ? candidates : orderCards(candidates)).slice(0, limit)

      const cards = selected.map((card) => ({
        cardId: card.id,
        noteId: card.note_id,
        direction: card.card_type as ReviewDirection,
        state: card.state,
        isNew: card.state === 'new',
        ...buildReviewCardSides((card.notes?.fields ?? {}) as Record<string, unknown>, language, card.card_type as ReviewDirection),
      }))

      return toTextResult(`Review session for ${deck.name}: ${cards.length} of ${candidates.length} matching cards.`, {
        deck: { id: deck.id, name: deck.name, language: deck.language },
        mode,
        totalMatching: candidates.length,
        returned: cards.length,
        instructions: [
          'Each card has a cardId; pass exactly that cardId to submit_review.',
          'Read each question aloud, then listen to the answer.',
          'Compare answers without diacritics (acceptedAnswersNormalized); voice recognition may spell target-language words in Cyrillic, so judge by sound.',
          'Accept only answers listed in acceptedAnswers for that card; do not treat near-synonyms (for example mluvit and říkat) as correct unless the card lists them.',
          'Say whether it was right; on a mistake give the correct answer.',
          'Call submit_review with again, hard, good or easy right after each card so progress is saved if the call drops.',
          'Re-ask cards graded again at the end of the session.',
        ],
        cards,
      })
    } catch (error) {
      return toToolError('Failed to load the review session.', { code: 'GET_REVIEW_SESSION_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to load the review session.', { tool: 'get_review_session', deckId: deck.id }) })
    }
  })

  server.registerTool('submit_review', {
    title: 'Submit an Echo review grade',
    description: 'Grade one card from get_review_session. Updates the FSRS schedule exactly like an in-app review and logs it. Rating: again, hard, good or easy (or 1-4).',
    annotations: { readOnlyHint: false, idempotentHint: false },
    inputSchema: {
      cardId: z.string().min(1),
      rating: z.union([z.enum(['again', 'hard', 'good', 'easy']), z.number().int().min(1).max(4)]),
      durationMs: z.number().int().min(0).max(3_600_000).optional().describe('Time spent on the card in milliseconds.'),
    },
  }, async ({ cardId, rating, durationMs }) => {
    const parsed = parseReviewRating(rating)
    if (!parsed) return toToolError('Rating must be again, hard, good, easy or 1-4.', { code: 'INVALID_RATING' })
    try {
      const { updatedCard, scheduledDays } = await submitReviewForUser(supabase, userId, cardId, parsed, durationMs ?? 0)
      return toTextResult(`Saved rating ${parsed}. Next review in ${scheduledDays} day(s).`, { cardId, rating: parsed, state: updatedCard.state, dueAt: updatedCard.due_at, scheduledDays })
    } catch (error) {
      return toToolError('Failed to submit the review.', { code: 'SUBMIT_REVIEW_FAILED', diagnostic: buildToolErrorDiagnostic(error, 'Failed to submit the review.', { tool: 'submit_review' }) })
    }
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
