# MCP note and card management

Requirements: [specs/SRS_NINJA_MCP_CARD_MANAGEMENT.md](../specs/SRS_NINJA_MCP_CARD_MANAGEMENT.md).

## Tools (`src/lib/mcp-server.ts`, server version 0.4.0)

| Tool | Annotations | Service call |
| --- | --- | --- |
| `list_notes` | read-only | `listNotesForUser` |
| `get_note` | read-only | `getNoteForUser` |
| `update_notes` | write, idempotent | `updateNotesForUser` |
| `edit_note_tags` | write, idempotent | `resolveNoteIdsForUser` + `editNoteTagsForUser` |
| `approve_drafts` | write | `approveDraftsForUser` → `approveDraftNoteForUser` / `approveDraftBatchForUser` |
| `resolve_draft_conflict` | destructive | `resolveDraftConflictForUser` / `applyDraftConflictToExistingNoteForUser` |
| `delete_notes` | destructive, `confirm: true` | `deleteNotesForUser` |
| `delete_draft_batch` | destructive, `confirm: true` | `deleteDraftBatchForUser` |

`confirm` is `z.literal(true)`, so the SDK rejects a call without it before the handler runs.

## Layers

- `src/lib/note-management.ts` holds the pure logic: `applyTagEdit` (setTags first, then add/remove, case-insensitive), `prepareNoteUpdate` (merge the field patch, normalize with `normalizeNoteFields`, validate the raw merged fields with `validateDraftCandidate`, and keep only issues in patched fields or a missing primary word so legacy notes stay editable), `noteMatchesQuery` (NFD + diacritic strip), `filterManagedNotes` and `toManagedNote` (memory state from `getNoteFsrsState`, like the deck page).
- `src/lib/note-management-service.ts` does the Supabase I/O with the bearer client, so RLS applies, and every query also filters by `user_id`. Notes are read in chunks of 100 ids. Draft approval, draft deletion and conflict resolution call the existing `draft-import-service` functions, so batch status sync and card creation are identical to the drafts screen. Approved-note deletion deletes the row directly (cards and review logs cascade), like `deleteNotes` in `src/lib/actions/notes.ts`. Audio regeneration uses `shouldGenerateAudioForNote` + `generateAndCacheAudio`, the same rule as `updateNoteFields`.
- Every bulk tool returns `{ updated, failed, results: [{ noteId, ok, error? }] }`; per-item errors never abort the rest. Paths `/deck/<id>` and `/deck/<id>/drafts` are revalidated for touched decks.

## Copy

`get_echo_guide` gains `managementWorkflow` and tool descriptions; its `safety` line now says approval and deletion happen only on request. The OAuth consent (`oauthConsent.createDrafts`, `noPublish`) and the `/mcp` guide page (`mcpGuidePage.pageDescription`, `allowedDrafts`, `blockedPublish`, `blockedDelete`, `claudeStep3`) were rewritten in en/ru/cs/tr.

## Tests

- `src/lib/note-management.test.ts`: tag edits, patch merge/validation, query and state filters.
- `src/lib/note-management-service.test.ts`: draft vs approved deletion routing, no write on invalid patch, tag-only writes.
- `src/lib/mcp-server.test.ts`: tool list and destructive annotations, batch retag, refusals, per-item summary, `confirm` gate.
