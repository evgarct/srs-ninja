# Review Queue Pacing

## Summary

Regular due review now behaves more like an Anki-style daily review session:

- due-session launch supports up to `200` due cards;
- new cards remain capped separately at `20`;
- `Again` and `Hard` no longer come back by fixed offsets near the front of the queue;
- difficult cards return through delayed reinsertion windows with slight bounded variation.

This keeps the existing FSRS scheduler intact while making the active queue feel less repetitive and less artificially small.

## Files

- `src/lib/review-config.ts`
- `src/lib/card-ordering.ts`
- `src/lib/review-loop.ts`
- `src/lib/review-loop.test.ts`
- `src/app/decks/[id]/review/page.tsx`
- `src/app/review/[deckId]/page.tsx`

## Due Session Sizing

Regular due review uses `REGULAR_DUE_REVIEW_LIMIT = 200`.

This replaces the previous small fixed launch slice in the regular due routes and is intended to behave like a product-level maximum reviews/day default.

Manual review and extra study keep their own selection behavior.

## New Card Limit

Regular due review still keeps a separate `REGULAR_DUE_NEW_CARD_LIMIT = 20`.

That means:

- the overall due session can include up to `200` gathered due cards;
- within that session, new cards are still intentionally capped to avoid overload.

## Requeue Model

`applyReviewQueueOutcome()` still owns the active in-session learning loop, but its reinsertion policy changed:

- `Good` / `Easy` remove the current card from the active queue;
- `Again` requeues the card into an earlier delayed window;
- `Hard` requeues the card into a later delayed window.

The helper now derives a reinsertion range from the number of remaining cards and picks an insert position inside that window.

This preserves the learning-loop semantics while avoiding the old fixed pattern that caused difficult cards to reappear too predictably.

## Why This Is Not a Scheduler Rewrite

The queue pacing layer only decides when a difficult card reappears inside the **current session**.

It does **not** replace the long-term scheduler:

- `submitReview()` still persists the user rating;
- `scheduleCard()` in `src/lib/fsrs.ts` still computes the actual FSRS update and future due date.

So the user-visible queue feels more natural, while the memory model remains unchanged.
