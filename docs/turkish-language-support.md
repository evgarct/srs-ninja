# Turkish language support

The application supports Turkish in two independent roles:

- UI locale `tr` (`tr-TR` for date and number formatting);
- study language `turkish` for decks and notes.

Opening a Turkish deck selects the Turkish message catalogue, following the same deck-locale behavior as English and Czech decks. Users may also select Türkçe from the global locale menu.

Deck filters, note create/edit forms, review headers and actions, completion statistics, errors, ARIA labels, and tooltips all read from the active message catalogue. Turkish deck locale switching must not expose Russian or English fallback copy on these surfaces.

The standalone `/notes/new` and `/notes/[id]/edit` routes resolve their provider and server headings from the loaded deck language, not only from the user's global locale. Expected save failures use localized generic copy instead of exposing raw server/provider messages.

All dashboard and completion actions enter review through `/review/[deckId]`, whose layout resolves the catalogue from the deck language. The legacy plural review route is not used for user-facing navigation.

## Deck direction

Every deck stores both `language` and `translation_language`. Supported study languages are `czech`, `english`, and `turkish`; supported translation languages are `russian`, `english`, `czech`, and `turkish`. The two values must differ. Existing decks receive `russian` during migration.

The database `decks_language_check` constraint mirrors the complete study-language list. Migration `20260815103325_allow_turkish_decks.sql` expands the original Czech/English constraint so Turkish deck inserts are accepted by Supabase as well as by application validation.

Turkish notes use the universal canonical contract: `word`, `translation`, `level`, `part_of_speech`, `popularity`, `style`, `synonyms`, `antonyms`, and `examples_html`. Turkish-specific parts of speech are validated while storage remains compatible with the English contract.

## Turkish TTS

Turkish audio uses ElevenLabs with `language_code = tr` and the existing `eleven_flash_v2_5` model. Every user selects a Turkish-trained voice in `/settings/elevenlabs`; a missing selection produces an explicit configuration error.

## Turkish note-field audit

The universal vocabulary fields remain useful and are preserved. Turkish adds two optional language-specific fields: `usage_pattern` for governed case/suffix and common constructions, and `grammar_note` for vowel harmony, stem alternations, and exceptions. `sayı` is a supported part of speech. Regular plural/case tables and full tense paradigms are intentionally excluded because they would add repetitive form data to ordinary vocabulary cards.

Both fields are normalized through create/edit/import/MCP paths and appear in the grammar note area of the flashcard. Existing notes without them remain valid.

Single-note generation, batch generation, review prefetch, caching, and autoplay use the same language-aware pipeline as English and Czech.

Batch generation resolves the user account and Turkish voice once before querying notes. Missing or invalid configuration fails immediately instead of waiting between guaranteed per-note failures.
