# Echo - Feature: Review Session UI Reset

## Context

The earlier mobile review pass moved the product toward a more app-like session, but the current stack-and-dock direction is still too experimental for a core learning surface:

- the stack treatment feels glitchy instead of stable;
- the dock metaphor does not fit the product's review UI;
- mobile lacks a clear exit action inside the review surface;
- the current background is too weak for the vertical review layout.

## Goal

Reset the review session UI to a simpler custom surface that feels reliable, readable, and mobile-first while preserving existing review mechanics.

## Product Rules

### 1. One live card, not a stack illusion

The review session should center one active flashcard.

Allowed:

- subtle depth hints behind the active card;
- fast card-to-card transitions;
- simple motion tied to rating feedback.

Avoid:

- fanned stack metaphors as the main visual model;
- effects that suggest multiple simultaneously active cards;
- motion that feels playful at the cost of clarity.

### 2. Custom bottom rating area

The review session must no longer depend on the dock-style feedback UI.

The rating surface should:

- use round rating buttons;
- sit at the bottom of the review screen;
- feel like floating Tinder-style action buttons rather than a toolbar or bordered utility block;
- stay easy to reach on mobile.

### 3. Emoji-only press feedback

Pressing a rating button should trigger a short-lived emoji burst:

- one brief transient effect per press;
- fast and non-blocking;
- no generic confetti particles;
- reduced-motion users should not get a noisy effect.

### 4. Mobile exit affordance

The review surface must include a clear top-left exit control on mobile.

It should feel like part of the session chrome rather than a hidden browser-navigation fallback.

### 5. Readable active background

The review background should use a readable centered light treatment over `#dedede`:

- active enough to support the vertical layout;
- readable behind the flashcard;
- currently allowed to be static while the animated React Bits `Light Pillar` treatment is being tuned;
- no heavy ambient motion or decorative noise.

### 6. Extra study header

`Extra study` should not show the centered session title block or the `n remaining` sublabel in the session header.

### 7. Shared review consistency

The new presentation should apply consistently wherever the shared review surface is used:

- regular due review;
- manual filtered review;
- extra study.

Review logic and FSRS behavior remain unchanged.

### 8. Mobile gesture containment

During the active mobile review card flow, the viewport itself should not rubber-band or drift vertically because of iOS overscroll behavior.

Allowed:

- internal scrolling inside explicit post-review surfaces such as the completion summary;
- intentional card motion tied to horizontal swipe rating.

Avoid:

- the page shifting a few pixels up or down while the user is trying to review;
- browser-level bounce competing with the card gesture.

### 9. Mobile swipe shortcuts

On mobile, the revealed card should support horizontal swipe grading:

- swipe left maps to `Again` / `Совсем не знаю`;
- swipe right maps to `Easy` / `Знаю очень хорошо`;
- the committed swipe should reuse the same directional card-dismiss motion and the same emoji burst feedback family as the matching button press.

Short or ambiguous drags must snap back without grading.

## Acceptance Criteria

- [ ] The review session no longer uses the current stack component for active-card presentation.
- [ ] The review session no longer uses the current dock component for feedback actions.
- [ ] The active card remains the primary focal point on mobile and desktop.
- [ ] Rating buttons are round and anchored to a floating bottom action area.
- [ ] The floating rating row does not use a labeled or bordered utility container.
- [ ] On mobile, the review surface shows a visible top-left exit action.
- [ ] In `Extra study`, the centered `Extra study` header block is absent.
- [ ] Pressing `Again`, `Hard`, `Good`, or `Easy` triggers a brief emoji-only burst that disappears automatically.
- [ ] The emoji feedback does not interrupt rapid repeated review.
- [ ] The review background uses an active centered treatment while preserving text and card readability.
- [ ] The updated presentation works in both mobile and web layouts.
- [ ] Review mechanics remain aligned across regular review, manual review, and extra study.
- [ ] On active mobile review, the viewport no longer rubber-bands vertically because of iOS overscroll.
- [ ] Revealed cards on mobile support swipe-left = `Again` and swipe-right = `Easy`.
- [ ] Swipe grading reuses the same directional exit treatment and emoji burst semantics as the matching rating buttons.
- [ ] Storybook reflects the touched reusable review UI states when practical.
- [ ] `docs/` and `specs/` are updated before PR creation to match shipped behavior.
