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

### Web feature parity (server 0.5.0)

Every web action now has an MCP tool backed by the same function:

| Web feature | Shared function | MCP tool |
| --- | --- | --- |
| Add note (published) | `saveDraftNotesForUser` + `approveDraftBatchForUser` via `createNotesForUser` | `create_notes` |
| Deck "Generate audio" (`/api/tts/batch`) | `generateDeckAudioForUser` (`note-audio-service.ts`) | `generate_note_audio` (`force`, `limit`, `remaining`) |
| Audio column / filter on the deck page | `getAudioMapForNotes` | `list_notes` / `get_note` (`hasAudio`, `audioUrl`, `audioFilter`) |
| ElevenLabs settings (read) | `getElevenLabsSettingsForUser` (`server/elevenlabs-settings.ts`) | `get_audio_settings` (never returns the key) |
| New deck | `createDeckForUser` (`deck-service.ts`) | `create_deck` |
| Home dashboard | `getDashboardStatsForUser` | `get_dashboard` |
| Stats page | `study-stats-service.ts` (today, card states, week + streak, history) | `get_study_stats` |
| Manual study / extra study | `getManualStudyCardsForUser` (tags, states, audio), `getExtraStudyCardsForUser`, `getExtraStudyCardsByKind` | `get_review_session` modes `tag` / `extra` |
| Session done | `markReviewSessionCompletedForUser` | `complete_review_session` |

The web server actions (`actions/decks.ts`, `actions/stats.ts`, `actions/elevenlabs.ts`), `/api/tts/batch` and `/api/mobile/decks/[deckId]/complete` were moved onto these functions, so web, Android and MCP share one implementation. Not exposed on purpose: connecting or disconnecting an ElevenLabs key and choosing voices (secrets stay in the settings page), Anki file import (needs a file upload), locale and sign-in.

`src/lib/mcp-server.test.ts` asserts that `get_echo_guide` describes exactly the registered tools, so a new tool cannot ship undocumented.

## Layers

- `src/lib/note-management.ts` holds the pure logic: `applyTagEdit` (setTags first, then add/remove, case-insensitive), `prepareNoteUpdate` (merge the field patch, normalize with `normalizeNoteFields`, validate the raw merged fields with `validateDraftCandidate`, and keep only issues in patched fields or a missing primary word so legacy notes stay editable), `noteMatchesQuery` (NFD + diacritic strip), `filterManagedNotes` and `toManagedNote` (memory state from `getNoteFsrsState`, like the deck page).
- `src/lib/note-management-service.ts` does the Supabase I/O with the bearer client, so RLS applies, and every query also filters by `user_id`. Notes are read in chunks of 100 ids; `list_notes` reads the deck in database pages of 1000 (`range`) before filtering, so `total` and offsets cover decks beyond the PostgREST response cap. Repeated items for the same note in one `update_notes` call build on the previous write. Draft approval, draft deletion and conflict resolution call the existing `draft-import-service` functions, so batch status sync and card creation are identical to the drafts screen. Approved-note deletion deletes the row directly (cards and review logs cascade), like `deleteNotes` in `src/lib/actions/notes.ts`. Audio regeneration uses `shouldGenerateAudioForNote` + `generateAndCacheAudio`, the same rule as `updateNoteFields`.
- Every bulk tool returns `{ updated, failed, results: [{ noteId, ok, error? }] }`; per-item errors never abort the rest. Paths `/deck/<id>` and `/deck/<id>/drafts` are revalidated for touched decks.

## Copy

`get_echo_guide` gains `managementWorkflow` and tool descriptions; its `safety` line now says approval and deletion happen only on request. The OAuth consent (`oauthConsent.createDrafts`, `noPublish`) and the `/mcp` guide page (`mcpGuidePage.pageDescription`, `allowedDrafts`, `blockedPublish`, `blockedDelete`, `claudeStep3`) were rewritten in en/ru/cs/tr.

## Tests

- `src/lib/note-management.test.ts`: tag edits, patch merge/validation, query and state filters.
- `src/lib/note-management-service.test.ts`: draft vs approved deletion routing, no write on invalid patch, tag-only writes.
- `src/lib/mcp-server.test.ts`: tool list and destructive annotations, batch retag, refusals, per-item summary, `confirm` gate.
