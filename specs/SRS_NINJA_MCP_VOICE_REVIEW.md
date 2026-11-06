# MCP voice review — expected behavior

## Goal
The user can ask an assistant over MCP to run a spoken review: the assistant asks cards, judges answers, and records grades so spaced repetition progresses exactly as in the app.

## Requirements
1. `get_review_session` returns only the authenticated user's approved cards of the selected deck.
2. Default session: today's due cards, RU → target language (production cards), ordered by the app's priority tiers with at most 20 new cards.
3. A tag session returns cards of notes that have all requested tags, regardless of due date; requesting it without tags is an error.
4. Every card carries its question, answer, accepted answer variants (translation alternatives and synonyms for production), a diacritics-free normalized form, and hints.
5. `submit_review` accepts `again`, `hard`, `good`, `easy` or 1-4, applies the same FSRS scheduling as an in-app review, and logs the review.
6. A card that does not belong to the user cannot be graded and nothing is written.
7. Each grade is saved immediately so an interrupted conversation keeps its progress.
8. The cards, including each `cardId`, are readable from the tool's text content, so a client that ignores `structuredContent` (for example Claude) can still run the session and call `submit_review`.
9. The session instructions tell the assistant to accept only a card's listed answers; near-synonyms are not accepted unless the card lists them.

## Non-goals
- No new card or note fields; no approval or deletion through MCP.
- Voice sessions do not mark the deck as "completed today".
