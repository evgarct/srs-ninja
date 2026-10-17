# Motion & Visual Design Pass

## Summary

Extends the review-session motion work from `review-session-polish.md` with a card flip, a live depth stack, a card-level rating reaction, a widened desktop layout, and a first motion pass across the app shell (nav, deck list).

## Files

- `src/components/flashcard/Flashcard.tsx`
- `src/components/vendor/reactbits-review-stack.tsx` (moved from `src/components/reactbits-review-stack.tsx`, adapted for live use)
- `src/components/review-session.tsx`
- `src/components/review-rating-burst.tsx` (unchanged logic, now paired with a glow pulse in `review-session.tsx`)
- `src/lib/review-rating-motion.ts`
- `src/components/flashcard/RatingButtons.tsx`
- `src/components/ui/card.tsx`
- `src/components/home-deck-card.tsx`
- `src/components/home-deck-list.tsx`
- `src/components/nav.tsx`

Removed (superseded, were unused in the live tree): `src/components/reactbits-stack.tsx`, `src/components/review-feedback-dock.tsx`.

## Card reveal flip

`Flashcard` wraps its content (everything except the persistent header action) in a single `AnimatePresence mode="wait"` keyed by `isRevealed`, with `rotateY` enter/exit variants and `perspective` on the card shell. This gives a real flip instead of a flat fade. Reduced-motion users get a plain opacity crossfade instead of the 3D rotation.

## Depth stack

`ReactBitsReviewStack` (`src/components/vendor/reactbits-review-stack.tsx`) renders up to 3 faint ghost cards behind the active card, sized from an invisible copy of the active card's content. It now accepts pass-through props (`activeCardAnimate`, `activeCardStyle`, `onActivePointer*`) so `review-session.tsx` can keep its existing live-swipe drag feedback and pointer handling while the stack owns the ghost-card rendering and the rating-driven enter/exit motion (`getReviewRatingMotion`).

The active card wrapper must stay `position: absolute` (the component's default) inside the stack — giving it `position: relative` double-counts its height against the invisible sizing placeholder and inflates the stack's layout.

## Rating reaction

`getReviewRatingMotion` now also returns a `glowColor` per rating. `review-session.tsx` renders a short radial-gradient pulse behind the card (keyed to the burst event) alongside the existing `ReviewRatingBurst` emoji. Both are gated on `!shouldReduceMotion`.

## Rating dock magnify

`RatingButtons`'s `floating` variant (used by the live desktop/mobile action bar) now tracks pointer position across the button row and applies a spring-smoothed scale to the hovered button, adapted from the previously-unused `review-feedback-dock.tsx` dock-magnification math. It only reacts to `mousemove`, so touch taps are unaffected.

## Desktop width

`review-session.tsx`'s content column widens with viewport size: `max-w-[36rem] sm:max-w-[40rem] lg:max-w-[46rem]`, instead of a fixed `36rem`. The session stays a single centered column; the existing ambient gradient background already fills the full available width.

## App shell

- `nav.tsx`: the active tab's background is now a `motion.span` with a shared `layoutId` per nav instance (desktop pill bar, mobile bottom bar), so it slides between tabs instead of snapping.
- `home-deck-list.tsx`: deck cards stagger-fade-in on mount (capped stagger delay, reduced-motion aware).
- `ui/card.tsx`: added an opt-in `interactive` prop (hover lift + press scale) rather than applying it to every `Card` usage — many existing `Card` usages (settings, login, stats) are non-clickable containers where a hover affordance would be misleading. `HomeDeckCard` opts in.
