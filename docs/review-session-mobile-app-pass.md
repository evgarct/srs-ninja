# Review Session UI Reset

## Summary

The shared review surface now behaves more like a focused app session:

- the global app navigation is removed entirely on review routes;
- the review shell owns its own top chrome and progress state;
- the current card can be hidden for the current session without touching FSRS data;
- hidden cards are dropped from the active queue only and do not write a review result.

## Files

- `src/components/review-session.tsx`
- `src/lib/review-loop.ts`
- `src/lib/review-loop.test.ts`
- `src/app/review/shared-review-page.tsx`

## Session-Local Hide

`excludeCurrentReviewCard()` removes only the current card from the in-memory queue.

This is intentionally different from grading:

- no `submitReview()` call;
- no scheduler mutation;
- no review history entry;
- no completion marker written just because the user hid the last visible card.

The action is meant for "not right now" situations, not for learning progress.

## Completion Semantics

Finishing the queue by grading the final card still counts as a completed session.

Ending the visible queue by hiding cards does not mark the session as completed in the persistent completion table.
