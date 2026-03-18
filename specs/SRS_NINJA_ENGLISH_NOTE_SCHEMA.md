# SRS Ninja — English Note Schema Cleanup

## Context

English notes currently mix several historical formats inside `notes.fields`:

- legacy `term` / `expression`;
- MVP draft-import keys like `example_sentence` / `example_translation`;
- older Anki-oriented `collocations`, emoji-heavy `style`, and `frequency`;
- partial AI-import notes with only `word` + `translation`.

This makes the product inconsistent across deck view, review, draft review, editor forms, MCP import, and ChatGPT instructions.

## Goal

Define one canonical English note contract and use it everywhere the app reads, edits, validates, imports, previews, and reviews English notes.

## Canonical English Note Contract

English note content must use these canonical keys inside `notes.fields`:

- `word`
- `translation`
- `level`
- `part_of_speech`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`

Note-adjacent data stays outside the fields payload:

- `tags` remain in `notes.tags`
- audio remains managed by the existing audio/TTS layer, not by a duplicated `fields.audio_url`

## Field Semantics

### Required fields

- `word`
- `translation`

### Optional controlled fields

- `level`
  - `A1`
  - `A2`
  - `B1`
  - `B2`
  - `C1`
  - `C2`
- `part_of_speech`
  - `noun`
  - `verb`
  - `adjective`
  - `adverb`
  - `pronoun`
  - `preposition`
  - `conjunction`
  - `phrasal verb`
  - `expression`
  - `idiom`
  - `collocation`
- `style`
  - `informal`
  - `neutral`
  - `formal`
  - `everyday`
  - `technical`
  - `academic`
  - `narrative`
  - `slang`
  - `poetic`
- `popularity`
  - integer `1..10`
  - displayed in UI as `5/10`

### Optional rich-content fields

- `synonyms`
  - stored as `string[]`
- `antonyms`
  - stored as `string[]`
- `examples_html`
  - stored as one HTML string
  - expected shape: `<ul><li>...</li><li>...</li></ul>`
  - should normally contain exactly 2 usage examples for the MVP cleanup
  - the studied word should be wrapped in `<b>` inside each example

## Legacy Read Compatibility

The read layer must remain tolerant of existing historical keys:

- primary word: `word -> expression -> term`
- examples: `examples_html -> collocations -> example_sentence/example_translation`
- popularity: `popularity -> frequency`
- style: canonical enum should still be inferred from verbose strings like `🎓 Neutral / ...`

If both canonical and legacy example fields are present, `examples_html` wins over `collocations`.

## Write Rules

All write paths for English notes must save only canonical keys:

- manual create
- manual edit
- draft review edit
- MCP draft import
- ChatGPT / remote MCP guidance

Writers must not create new English notes with:

- `term`
- `expression`
- `collocations`
- `frequency`
- `example_sentence`
- `example_translation`
- free-form emoji-prefixed style text

## UX Requirements

The same English schema must drive:

- note creation form
- note edit sheet
- draft review editor
- flashcard preview
- review session mapping
- MCP deck contract endpoint
- ChatGPT onboarding instructions

## Draft Import Requirements

The MCP draft contract for English decks must accept:

- scalar strings for regular fields
- integer-like values for `popularity`
- `string[]` or text input for `synonyms` / `antonyms`
- HTML string for `examples_html`

The import layer must normalize legacy aliases when helpful, but the final saved payload must be canonical.

For Anki `.apkg` imports specifically:

- imported `extra` HTML must not be trusted as safe render-ready HTML;
- the importer must sanitize it to plain example text and rebuild canonical `examples_html`;
- active markup such as scripts or arbitrary embedded tags must not survive into stored `examples_html`.

## Tags

English tag taxonomy should remain hierarchical and explicit.

Recommended dimensions:

- grammar
- topic
- style
- level
- source
- set

Minimum recommended tag coverage for AI-imported notes:

- grammar
- topic
- style
- level

## Migration Strategy

For this cleanup branch, English deck content may be reset to avoid carrying forward mixed historical formats.

After reset:

- new English notes should be written only in canonical shape;
- legacy read compatibility remains in code for safety;
- no backfill is required for deleted English content.

## Acceptance Criteria

- [ ] English create/edit forms save only canonical keys.
- [ ] Draft review uses the same canonical fields as regular editing.
- [ ] `mapFieldsToFlashcard()` renders canonical English fields without fallback-only behavior.
- [ ] MCP `get_deck_contract` exposes the canonical English contract.
- [ ] MCP `save_draft_notes` accepts canonical English fields and stores canonical data.
- [ ] ChatGPT instructions for English import mention canonical keys, enum values, and `examples_html`.
- [ ] English deck can start from a clean state without old-format notes in the database.
- [ ] If both `examples_html` and `collocations` exist, the canonical `examples_html` value is preserved.
- [ ] Anki import sanitizes `extra` HTML before storing it as `examples_html`.
