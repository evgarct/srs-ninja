# Echo - Feature: Motion & Visual Design Pass

## Context

The review session already had a progress header and basic card-swap motion (see `SRS_NINJA_REVIEW_SESSION_POLISH.md`), but:

- the card reveal was a flat text fade, with no sense of a physical card turning over;
- the depth-stack and hover-magnify rating dock existed in the codebase but were never wired into the live flow;
- the rating reaction was a single floating emoji with no card-level feedback;
- desktop review was capped at the same width as mobile (`36rem`), so a wide monitor just showed a narrow card surrounded by empty background;
- outside review (nav, deck list, stats), the app had almost no motion at all — the active nav tab snapped instead of sliding, and deck cards had no hover/press feedback or entrance animation.

The product needs the review surface — and the app shell around it — to feel like a native, fluid app rather than a static document, on both mobile and desktop, without turning review into a dashboard.

## Goal

Make the card/review system and the surrounding app shell feel alive through restrained, fast motion, and let the review session use the extra width available on desktop instead of staying mobile-width.

## Product Rules

### 1. Card reveal

Revealing a card's answer performs a real 3D flip (`rotateY`) rather than a flat content swap. Under `prefers-reduced-motion`, the flip degrades to a simple crossfade.

### 2. Depth stack

The review session shows up to 3 faint ghost cards behind the active card, hinting at the remaining queue. The active card's enter/exit motion direction is driven by the rating just given (left for Again/Hard, right for Good/Easy).

### 3. Rating reaction

Rating a card produces two layered cues: the existing floating emoji burst, and a brief radial color-glow pulse behind the card keyed to the rating's color. Both are skipped under `prefers-reduced-motion`.

### 4. Desktop rating dock

On pointer devices, hovering a rating button magnifies it slightly (dock-style), independent of the tap/click action. Touch interaction is unaffected since it has no hover state.

### 5. Desktop width

The review session widens progressively on larger viewports (mobile: `36rem` → tablet: `40rem` → desktop: `46rem`) instead of staying fixed at mobile width. It remains a single centered column — no multi-pane dashboard layout.

### 6. App shell motion

- The active nav tab is indicated by a pill that slides between tabs instead of snapping.
- The deck list stagger-animates in on load and each deck card gets a hover lift / press feedback.

### 7. Motion discipline

All motion stays subtle, fast, and respects `prefers-reduced-motion` — consistent with the existing review-session polish rules. No new decorative looping animation.

## Acceptance Criteria

- [x] Card reveal performs a 3D flip, with a reduced-motion fallback.
- [x] The review session shows a depth stack of upcoming cards behind the active one.
- [x] Rating a card shows both the emoji burst and a color-glow pulse.
- [x] Rating buttons magnify on hover (desktop/pointer only).
- [x] The review session widens on tablet/desktop viewports while staying a single column.
- [x] The active nav tab uses a sliding indicator instead of a snap.
- [x] The deck list stagger-animates in and each card has hover/press feedback.
- [x] All new motion respects `prefers-reduced-motion`.
