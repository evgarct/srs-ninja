# Review Session UI Reset

## Summary

The review surface now uses a simpler custom shell instead of the previous stack-and-dock treatment:

- one active flashcard stays in focus;
- the bottom action area uses floating Tinder-like round rating buttons instead of the dock component;
- rating presses trigger a short emoji-only burst;
- `Extra study` no longer shows the session title in the centered header area;
- mobile review has a visible top-left exit control;
- the background is currently a static soft-light treatment over `#dedede`; the animated React Bits `Light Pillar` experiment is temporarily hidden.

Review mechanics, FSRS behavior, queue pacing, and card content remain unchanged.

## Files

- `src/components/review-session.tsx`
- `src/components/review-rating-burst.tsx`
- `src/components/flashcard/RatingButtons.tsx`
- `src/components/flashcard/RatingButtons.stories.tsx`
- `src/components/flashcard/Flashcard.stories.tsx`
- `specs/SRS_NINJA_REVIEW_SESSION_MOBILE_APP_PASS.md`

## Review Shell

`ReviewSession` now owns a dedicated session shell instead of composing the earlier `ReactBitsReviewStack` and `ReviewFeedbackDock`.

The shell now provides:

- top review chrome with exit action and progress ring;
- `Extra study` intentionally removes the centered session label block;
- one animated live-card surface over the full-page pillar background;
- a floating bottom action row that appears only after reveal.

The old stack illusion is no longer the primary interaction model.

## Bottom Rating Area

`RatingButtons` keeps the same ratings and keyboard meanings, but the presentation changed:

- each action is circular and icon-led;
- the row floats directly above the browser bottom edge;
- there is no labeled or bordered utility container around the buttons;
- the interaction direction is closer to Tinder-style floating action controls than to a dock or sheet.

The shell captures the pressed button position so feedback effects can originate from the tapped rating instead of from a generic center point.

## Emoji Burst Feedback

`ReviewRatingBurst` remains emoji-only and now supports an explicit horizontal anchor.

The review shell passes the pressed button location into the burst so the effect appears from the selected rating area.

The burst:

- is transient;
- ignores pointer events;
- is disabled for reduced-motion users;
- persists briefly even after the session advances to the next card.

## Background Treatment

The session background is currently a static light treatment over `#dedede`, with brighter falloff at the center and edges.

The animated React Bits `Light Pillar` component remains in the codebase but is temporarily hidden while the visual treatment is being tuned.

## Storybook

Reusable touched UI states are reflected in Storybook through:

- updated circular `RatingButtons` stories;
- updated flashcard shell stories that better match the new review atmosphere.

## Verification

Run the relevant checks for this pass before opening a PR:

- `npx eslint src/components/review-session.tsx src/components/review-rating-burst.tsx src/components/flashcard/RatingButtons.tsx src/components/flashcard/Flashcard.stories.tsx src/components/flashcard/RatingButtons.stories.tsx`
- `npx tsc --noEmit`
- `npm run build-storybook`
