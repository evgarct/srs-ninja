# Echo — Feature: MCP Note and Card Management

## Context

An agent (Hermes, Claude, ChatGPT) prepares lesson drafts through Echo MCP. Before 2026-11-27 MCP could only create and list drafts. When the user asked to retag 46 drafts of the "Rukodělné práce" lesson, the agent could not: editing, approval and deletion existed only in the web UI behind a browser sign-in. The agent correctly refused to create duplicates.

## Goal

Everything the user can do with notes and drafts in Echo, an MCP agent can do on the user's request, with the same rules as the web app.

## Requirements

1. **Find notes.** `list_notes` lists a deck's approved notes, drafts, or both, with fields, tags, memory state (as on the deck page) and cards. Filters: tags (all must match, case-insensitive), FSRS states, and a text query over any field that ignores case and diacritics. Results are paginated (`limit` ≤ 200, `offset`). `get_note` returns one note.
2. **Edit notes.** `update_notes` edits up to 200 drafts or approved notes per call. `fields` is a partial patch merged into the stored fields; an empty string clears a field. Patched fields are validated against the deck contract (required primary word, enum values); invalid items are reported and not written. Approved notes keep their cards and review history. Audio regenerates only for approved notes whose word changed, as in the web editor.
3. **Bulk tags.** `edit_note_tags` changes tags on many notes, selected by `noteIds` or by `batchId` (every note of a draft batch). `setTags` replaces, then `addTags` / `removeTags` apply. Tags are de-duplicated case-insensitively.
4. **Approve.** `approve_drafts` publishes drafts by `noteIds` or a whole `batchId`, creating cards exactly like Approve in Echo. Drafts with an open similar-note conflict are skipped and reported. Agents approve only when the user asked.
5. **Conflicts.** `resolve_draft_conflict` offers the drafts-screen actions: keep both (`kept_separate`), dismiss (`ignored`), or apply the draft to the existing note (`apply_to_existing`).
6. **Delete.** `delete_notes` deletes drafts or approved notes; `delete_draft_batch` deletes a draft-only batch. Both require `confirm: true` and are marked destructive. Deleting an approved note removes its cards and review history.
7. **Per-item results.** Bulk tools return `updated`, `failed` and a per-note `ok`/`error` list; one bad note never aborts the others.
8. **Same rules as the web.** Draft approval, deletion and conflict resolution call the same services as the drafts screen; field normalization and audio rules are shared with the web editor. No MCP-only product rule.
9. **Consent and guide copy** state the new scope in all locales: the connection can create, edit, approve and delete notes on request, and cannot change or delete decks or reach other accounts.

## Non-goals

- Creating, renaming or deleting decks.
- Moving notes between decks.
- Changing FSRS scheduling outside `submit_review`.

## Acceptance

- Retagging every draft of a batch by `batchId` works in one call and creates no duplicates.
- An invalid enum value or an emptied primary word is rejected per item with the reason.
- `delete_notes` without `confirm: true` is refused before any write.
- The Evgenii Hub catalog lists all `echo_*` tools after deploy.
