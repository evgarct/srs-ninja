# Review Session Mobile App Pass

## Summary

The review session now behaves more like a focused mobile app screen on phones:

- mobile review routes hide the global top navigation;
- the local review header is tighter and more app-like;
- answer buttons move into a sticky bottom action bar on mobile;
- card details are presented with stronger hierarchy and delayed secondary detail;
- card transitions now leave in the direction of the chosen answer;
- a short emoji burst adds fast tactile feedback after grading.

## Files

- `src/app/decks/[id]/review/page.tsx`
- `src/app/review/[deckId]/page.tsx`
- `src/components/nav.tsx`
- `src/components/review-session.tsx`
- `src/components/review-rating-burst.tsx`
- `src/components/flashcard/Flashcard.tsx`
- `src/components/flashcard/RatingButtons.tsx`
- `src/lib/review-rating-motion.ts`
- `src/lib/review-rating-motion.test.ts`
- `src/components/flashcard/Flashcard.stories.tsx`
- `src/components/flashcard/RatingButtons.stories.tsx`

## Mobile Shell

Review pages now use a more compact local header and hide the global nav on mobile review routes.

This reduces the feeling of reviewing inside a long document and gives the card stack more of the first screen.

## Sticky Action Bar

`Flashcard` can now render rating actions in a mobile-only sticky bottom bar.

This action bar:

- appears only after reveal;
- respects bottom safe-area insets;
- keeps the four ratings visible without additional scrolling;
- switches back to inline actions on desktop.

## Card Hierarchy

The flashcard body keeps the same information model, but the mobile presentation is more focused:

- tighter spacing and headline sizing on phones;
- reveal hint uses mobile-friendly copy;
- low-priority details such as frequency/style/notes live in a softer supplementary block;
- the main word, translation, examples, and actions stay visually dominant.

## Directional Motion

`ReviewSession` now maps each rating to its own entry/exit motion preset through `getReviewRatingMotion()`.

The motion model is intentionally simple:

- `Again` exits harder to the left;
- `Hard` exits left but less aggressively;
- `Good` exits right;
- `Easy` exits farther to the right.

The next card enters from the opposite side with a short spring transition.

## Emoji Burst

`ReviewRatingBurst` adds a brief directional emoji burst after grading.

This effect is:

- short-lived;
- pointer-events-free;
- disabled when reduced motion is requested.

It is meant to feel more tactile and alive, borrowing the spirit of Magic UI / React Bits interaction patterns without importing a separate visual system.

## Storybook and Verification

Storybook now includes mobile-oriented stories for:

- `Flashcard` in a mobile app review shell;
- `RatingButtons` in a sticky bottom-bar treatment.

Verification run for this pass:

- `npx vitest run --config vitest.unit.config.ts src/lib/review-rating-motion.test.ts`
- `npx eslint src/components/review-session.tsx src/components/review-rating-burst.tsx src/components/flashcard/Flashcard.tsx src/components/flashcard/RatingButtons.tsx src/components/nav.tsx src/app/decks/[id]/review/page.tsx src/app/review/[deckId]/page.tsx src/lib/review-rating-motion.ts src/lib/review-rating-motion.test.ts src/components/flashcard/Flashcard.stories.tsx src/components/flashcard/RatingButtons.stories.tsx`
- `npx tsc --noEmit`
- `npm run build-storybook`
