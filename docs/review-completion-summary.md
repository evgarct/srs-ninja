# Review Completion Summary

## Summary

The review done state is now a first-class completion surface instead of a plain text block.

It provides:

- a richer session summary;
- answer distribution;
- total time spent;
- session-specific explanatory copy;
- a restrained completion animation for the regular due-review ritual.
- resilience against post-submit route refreshes, so the user keeps seeing the completed-session summary instead of a generic empty-state fallback.

## Files

- `src/components/review-session-complete.tsx`
- `src/components/review-session-complete.stories.tsx`
- `src/components/review-session.tsx`

## Session Stats Model

`ReviewSession` now tracks:

- total reviews;
- correct reviews;
- total duration;
- rating distribution for `Again`, `Hard`, `Good`, `Easy`.

This allows the done screen to explain both outcome and difficulty, not just accuracy.

## Completion Behavior

`ReviewSession` stores the final session summary in browser `sessionStorage` and marks the active review URL with `completed=1` when the last card is rated.

If a server refresh happens after the final review submission, the review pages render a small restore wrapper that rehydrates `ReviewSessionComplete` from this stored state. This prevents the route-level "no cards due" screen from replacing the summary that the user just earned.

### Due review

Regular due review gets the strongest completion treatment:

- success badge;
- completion headline;
- subtle particle burst;
- explanation that today's main session for the deck is complete.

### Manual review

Manual review uses the same summary structure, but avoids the same ritualized success framing.

### Extra study

Extra study is framed as additional practice, not as the main daily completion ritual.

## Motion

The component uses `motion` for lightweight completion animation:

- spring-based entry for cards and badges;
- small particle burst on due-session completion;
- reduced-motion-safe behavior through `useReducedMotion()`.

The animation remains short, non-blocking, and mobile-safe.
