# Review Completion Summary

## Summary

The review done state is now a first-class completion surface instead of a plain text block.

It provides:

- a richer session summary;
- answer distribution;
- total time spent;
- session-specific explanatory copy;
- a restrained completion animation for the regular due-review ritual;
- a mobile-safe scrollable completion surface with the main exit controls available at the top;
- resilience against post-submit route refreshes, so the user keeps seeing the completed-session summary instead of a generic empty-state fallback.

## Files

- `src/app/review/shared-review-page.tsx`
- `src/components/review-session-complete.tsx`
- `src/components/review-session-complete.stories.tsx`
- `src/components/review-session.tsx`
- `src/lib/review-session-route.ts`

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

All review entry points now flow through the same route parser and shared server page renderer. Due review, manual review, and extra study therefore reuse the same completion-restore logic, empty-state selection, and `sessionMode` semantics instead of maintaining route-specific branches.

### Due review

Regular due review gets the strongest completion treatment:

- success badge;
- shorter completion headline and copy;
- top action row with direct return control;
- repeating subtle particle bursts while the completion state is visible;
- explanation that today's main session for the deck is complete.

### Manual review

Manual review uses the same summary structure, but avoids the same ritualized success framing.

### Extra study

Extra study is framed as additional practice, not as the main daily completion ritual.

## Motion

The component uses `motion` for lightweight completion animation:

- spring-based entry for cards and badges;
- small periodic particle bursts on the completion screen while it remains open;
- reduced-motion-safe behavior through `useReducedMotion()`.

The animation remains short, non-blocking, and mobile-safe.

## Mobile Layout

`ReviewSessionComplete` now owns its own vertical scrolling inside the fixed-height review shell.

This prevents the previous mobile trap where the summary card could become taller than the viewport while the parent review page stayed `overflow-hidden`.

The action row sits in a sticky top area so the user can always:

- go back home;
- jump to the deck or restart due review;
- avoid needing to scroll to the bottom just to leave the screen.

The metric and answer-distribution blocks now use a compact 2-column mobile layout to reduce overall height.

The internal summary sections intentionally avoid heavy nested borders:

- the outer completion card remains the primary surface;
- metric tiles use softer filled panels instead of hard card-on-card borders;
- the answer distribution group reads as a quiet grouped block rather than another bordered container.
