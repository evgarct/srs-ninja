# MCP voice review

Two MCP tools let an assistant (for example Claude in voice mode) run a spoken review session against the same FSRS schedule the app uses.

## Tools

### `get_review_session`
- Input: deck selector (`deckId` / `language` / `name`), `mode` (`due` default, or `tag`), `tags` (required for `tag`), `direction` (`production` default, `recognition`, `both`), `limit` (1-100, default 30).
- `due`: fetches due approved cards through `getDueCardsForUser`, filters by direction, then applies `orderCards` (relearning, learning, new capped at 20, review; sibling separation) and slices to `limit`. Direction is filtered before ordering so the new-card cap is not split across directions.
- `tag`: `getManualStudyCardsForUser` — notes carrying every tag, any due date, same as manual study in the app.
- Each card: `cardId`, `noteId`, `direction`, `state`, `isNew`, `question`, `answer`, `acceptedAnswers`, `acceptedAnswersNormalized`, `hints` (part of speech, gender, note).
- `production` asks the Russian `translation` and expects the expression (RU → target language); `recognition` is the reverse. This mirrors the flashcard component.

### `submit_review`
- Input: `cardId`, `rating` (`again` / `hard` / `good` / `easy` or 1-4), optional `durationMs`.
- Calls `submitReviewForUser`: loads the card scoped to the user, runs `scheduleCard` (ts-fsrs), updates `cards`, inserts a `reviews` row. The in-app `submitReview` server action uses the same function.

## Accepted answers
No schema field exists for alternatives, so they are derived in `src/lib/review-answer-variants.ts`:
- the answer side is split on `,` `;` `/`;
- for `production`, the note's `synonyms` are added;
- duplicates are removed ignoring case and diacritics;
- `acceptedAnswersNormalized` lowercases and strips diacritics for comparison. The assistant makes the final call, judging by sound for speech-recognition spellings.

## Text content mirrors the payload
Every Echo MCP tool result (success and error) puts a one-line summary followed by the compact JSON of `structuredContent` into its text content (`toTextResult` / `toToolError` in `src/lib/mcp-server.ts`). `structuredContent` is still sent. Without this, Claude saw only `Review session for CZ: 20 of 65 matching cards.` and had no `cardId` to grade (observed 2026-11-05). The tools declare no `outputSchema`, and the MCP spec recommends mirroring structured output as text in that case. `src/lib/mcp-server.test.ts` checks this through a real MCP client over an in-memory transport.

## Shared service and auth
`src/lib/review-service.ts` holds the data access used by both the cookie-bound server actions (`src/lib/actions/cards.ts`, RLS only) and MCP. MCP passes `userId` so every query filters on `user_id`, because the legacy shared-secret mode uses an admin client without RLS.

## Not covered
- The in-session Again/Hard re-queue stays client-side in the app; the tool instructions tell the assistant to re-ask `again` cards at the end.
- `review_session_completions` is not written, so the dashboard "done today" state is unaffected by voice sessions.
