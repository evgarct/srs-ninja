# Review Session Polish

## Summary

The review session shell now provides stronger flow cues without changing the learning mechanics:

- richer progress header;
- session-type badge;
- remaining-card context;
- subtle stacked-card background layers;
- smooth card enter/exit transitions using `motion`.

## Files

- `src/components/review-session.tsx`

## Progress Surface

The old plain progress row is replaced with a more explicit session header that shows:

- session type (`Due review`, `Manual review`, `Extra study`);
- current queue progress;
- short explanatory copy;
- remaining-card count.

This gives the user better context before interacting with the current card.

## Stack Depth

The current card sits above two soft background layers that hint at the remaining queue.

These layers are:

- purely visual;
- non-interactive;
- hidden when there is no deeper queue to suggest.

The goal is to make the session feel like a living stack, not a single static card.

## Motion

`ReviewSession` now uses `AnimatePresence` and `motion.div` to transition between cards.

The transition stays restrained:

- short fade/translate/scale changes;
- no long waits;
- no interruption to the learning loop.
