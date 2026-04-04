# Echo - Feature: Review Completion Summary

## Context

The current review done state is too thin:

- it shows only reviewed cards count and accuracy;
- it does not feel rewarding enough;
- it does not help the user understand what happened in the session.

This is especially weak for the regular due-review flow, which should feel like a meaningful daily ritual.

## Goal

Turn the completion state into a compact but meaningful product surface:

- visibly rewarding;
- still calm and system-aligned;
- informative enough that the user leaves with a clear mental model of the session outcome;
- safe and escapable on mobile screens.

## Product Rules

### 1. Summary content

The done state must show more than raw accuracy.

Minimum summary:

- cards reviewed;
- answer distribution (`Again`, `Hard`, `Good`, `Easy`);
- total time spent;
- success rate;
- short explanation of what happens next.

The mobile version should prefer compact presentation over tall stacked blocks when the same information can be shown in a denser layout.

### 2. Celebration

For regular due review:

- show a subtle celebratory moment on completion;
- keep it fast and non-blocking;
- do not turn the session into a noisy arcade effect.

The completion surface may keep a light repeating celebration pulse while the user stays on the screen, as long as:

- it does not block reading;
- it does not interfere with controls;
- it respects reduced-motion preferences.

For manual review and extra study:

- use the same structural summary surface;
- do not use the same strong completion semantics as the main due-review ritual.

### 3. Visual language

The completion screen must stay inside the current design system:

- use shared card/badge/button primitives;
- support mobile layouts cleanly;
- keep the same dark review-stage visual language as the active session instead of flipping to a light summary surface;
- motion should be restrained and functional.
- avoid excessive nested borders or card-inside-card noise on the completion summary.

### 4. Mobile escape hatch

On mobile, the user must be able to leave the completion screen without needing to reach the bottom of a tall summary card.

The completion surface must therefore provide:

- an always-reachable return-to-home action near the top;
- a compact enough summary that the surface does not feel trapped on phone-sized screens;
- a scrollable completion container if the content still exceeds the viewport.

### 5. Refresh resilience

If the review route refreshes after the last submitted rating:

- the user must still see the finished-session summary;
- the app must not replace that summary with a generic "no cards due" empty state;
- this must hold for the session that was just completed, even if the underlying due queue is now empty on the server.

The review route handling for due review, manual review, and extra study must share the same mode parsing and completion-restore mechanism so that one session type cannot drift into different end-of-session behavior.

## Acceptance Criteria

- [ ] Regular due completion shows a richer summary than the current count + accuracy line.
- [ ] The screen includes answer distribution, time spent, and short explanatory copy.
- [ ] The due-review completion state feels rewarding without becoming noisy.
- [ ] Manual review and extra study use appropriate non-due messaging.
- [ ] After the last review submission, the route must not fall back to the generic empty queue screen for that finished session.
- [ ] Due review, manual review, and extra study reuse one shared route-level completion restore path.
- [ ] On mobile, the completion surface remains scrollable even inside the fixed-height review shell.
- [ ] On mobile, a return-to-home control is reachable near the top of the completion screen.
- [ ] The completion surface works on desktop and mobile.
- [ ] The completion surface has a fullscreen Storybook story for desktop and mobile visual review without auth or live review state.
