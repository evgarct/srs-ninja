# English Note Schema

## Summary

English notes now have a dedicated canonical schema layer instead of relying on a loose mix of historical field names.

The implementation goal is:

- one canonical English content model;
- one shared normalization path for create/edit/import;
- one shared read path for flashcards and review;
- backward-tolerant reading of legacy payloads without writing them again.

## Canonical Stored Keys

Canonical English note content inside `notes.fields`:

- `word`
- `translation`
- `level`
- `part_of_speech`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`

Outside `fields`:

- `notes.tags` stores tags
- audio stays in the audio/TTS subsystem and is surfaced in UI separately

English tags are part of the normal editing contract, not draft-import-only metadata.
Manual create, full-page edit, inline deck edit, draft review edit, and MCP draft import must all preserve and update `notes.tags`.

## Why Audio Stays Outside `fields`

The app already treats audio as generated and cached note-adjacent data:

- generation is explicit and language-aware;
- draft notes cannot trigger audio generation before approval;
- playback resolves from the audio cache layer, not from arbitrary note JSON.

Because of that, the cleanup keeps audio out of the canonical English field payload and avoids introducing a second source of truth for the same asset.

## Shared Schema Module

English-specific definitions live in:

- `src/lib/english-note-schema.ts`

This module is responsible for:

- canonical English field definitions for UI;
- enum normalization;
- list parsing for `synonyms` / `antonyms`;
- legacy fallback mapping for examples, popularity, and style;
- flashcard-friendly extraction helpers.

## Shared Read Path

Primary word lookup still goes through:

- `getNotePrimaryText(fields)`

Order:

- `word`
- `expression`
- `term`

English examples resolve through:

- `examples_html`
- fallback `collocations`
- fallback legacy `example_sentence` / `example_translation`

When English notes are imported from Anki, arbitrary `extra` HTML must not be stored as trusted `examples_html` verbatim.
The importer sanitizes it into plain-text example items and then rebuilds canonical safe `<ul><li>...</li></ul>` markup.

English popularity resolves through:

- `popularity`
- fallback `frequency`

## Shared Write Path

All English write flows must normalize to canonical shape before persisting:

- `createNote`
- `updateNote`
- `updateNoteFields`
- draft import validation

The normalization rule is:

- accept legacy-ish input when needed;
- save only canonical keys.

## Form Model

Editor and create forms use the same English field list:

- `word`
- `translation`
- `level`
- `part_of_speech`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`

Form-only representation details:

- `popularity` is edited as a select with values `1..10`
- `synonyms` and `antonyms` are edited as textareas and converted to `string[]`
- `examples_html` is edited directly as HTML list markup

## Flashcard Mapping

`mapFieldsToFlashcard()` now treats English data as canonical:

- `examples_html` becomes `examples[]`
- `popularity` becomes the flashcard frequency bar value
- `style` is shown as a clean normalized label

This keeps preview and live review aligned with the same contract.

## MCP / ChatGPT Contract

For English decks, MCP should expose and accept the same canonical field names.

Recommended AI-import payload:

- `word`
- `translation`
- `level`
- `part_of_speech`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`
- `tags` as a separate `string[]` payload outside `fields`

Recommended prompt guidance:

- `popularity` should be numeric `1..10`
- `synonyms` / `antonyms` may be arrays
- `examples_html` should be an HTML `<ul>` with two usage examples and `<b>` around the studied word
- note-level tags should go into `item.tags`, not into `fields`
- batch-level tag intent can go into `metadata.requestedTags`
- ChatGPT should call `get_deck_contract` before saving drafts and follow the returned options exactly
- ChatGPT should avoid legacy English keys for any newly created note

## Current Cleanup Strategy

Because the English deck was reset in Supabase, the cleanup can proceed without preserving mixed historical records in production content.

The code still keeps read compatibility for older English payloads so that:

- imported backups;
- local fixtures;
- old stories/tests;
- future data restores

do not fail abruptly.
