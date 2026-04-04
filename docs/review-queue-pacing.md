# Review Queue Pacing

## Summary

Regular due review now gathers a wider due-card candidate pool before the session is trimmed.

That changes the feel of the queue without changing FSRS:

- the SQL query still starts from the oldest due cards;
- the app now fetches a wider candidate window than the visible session limit;
- card ordering and sibling separation run on that wider pool;
- only then is the regular session trimmed back to the configured limit;
- extra study also samples new cards from a wider oldest-first pool before shuffling them into the session.

This reduces the "same order they were added" feeling while preserving scheduler integrity.

## Files

- `src/lib/actions/cards.ts`
- `src/lib/review-card-selection.ts`
- `src/lib/card-ordering.ts`
- `src/app/review/shared-review-page.tsx`
- `src/lib/review-card-selection.test.ts`

## Candidate Pool

Regular due review still uses `REGULAR_DUE_REVIEW_LIMIT = 200` as the visible session size.

The fetch step now expands that limit through `getReviewSessionCandidateLimit()`:

- session limit `200`;
- candidate multiplier `4`;
- fetched due-card window `800`.

This keeps the queue anchored in genuinely due cards, but gives the ordering layer enough room to produce a less mechanical sequence.

## Final Session Trim

`selectReviewSessionCards()` now owns the final trim for regular due review:

1. order the candidate pool;
2. apply sibling separation and tier logic;
3. slice the ordered result to the visible session limit.

Manual review and extra study still bypass the regular due ordering path.

## Extra Study Sampling

Extra study no longer takes the first `N` new cards straight by `created_at`.

Instead it:

1. fetches a wider oldest-first new-card pool;
2. shuffles that pool locally;
3. slices the requested extra-study size;
4. tops up with upcoming scheduled cards only if needed.

That keeps extra study from feeling like a strict insertion-order drill.

## Scheduler Integrity

None of this rewrites FSRS:

- `submitReview()` still persists the rating exactly as before;
- `scheduleCard()` still computes the next due date;
- the widened candidate pool changes only which cards enter the current session, not how future intervals are scheduled.
