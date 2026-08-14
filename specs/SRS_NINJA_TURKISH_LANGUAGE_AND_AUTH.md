# Turkish language, deck direction, and auth redirects

## Product requirements

- Users can select Türkçe as the application locale.
- Users can create Czech, English, or Turkish decks and independently choose Russian, English, Czech, or Turkish as the translation language.
- A deck cannot use the same study and translation language.
- Existing decks keep their behavior with Russian as the translation language.
- Turkish decks use the universal note contract, with Turkish parts of speech and Turkish TTS.
- Turkish audio requires a Turkish-trained ElevenLabs voice configured by environment.
- Email confirmation and OAuth callbacks use the canonical production `APP_URL`; production must never fall back to localhost.
- Supabase Site URL, redirect allow list, and email template must agree with the application callback.

## Acceptance criteria

- Turkish UI, creation, deck, review, stats, auth, empty states, and rating states render without missing messages on desktop and mobile.
- Note forms, deck filters, review completion copy, errors, tooltips, and accessible names contain no hard-coded Russian or English text when the Turkish locale is active.
- Turkish → Russian/English/Czech decks can be created; Turkish → Turkish is rejected in both domain validation and the database.
- Turkish notes pass import/MCP validation, render cards, and generate/cache audio using `language_code = tr`.
- Missing `ELEVENLABS_TURKISH_VOICE_ID` produces an explicit error.
- Turkish batch TTS preflights the current user's account and selected Turkish voice before iterating notes.
- A production registration email resolves to `${APP_URL}/auth/callback`, never localhost.
