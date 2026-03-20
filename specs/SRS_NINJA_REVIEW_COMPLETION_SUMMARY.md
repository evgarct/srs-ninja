# SRS Ninja - Feature: Review Completion Summary

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
- informative enough that the user leaves with a clear mental model of the session outcome.

## Product Rules

### 1. Summary content

The done state must show more than raw accuracy.

Minimum summary:

- cards reviewed;
- answer distribution (`Again`, `Hard`, `Good`, `Easy`);
- total time spent;
- success rate;
- short explanation of what happens next.

### 2. Celebration

For regular due review:

- show a subtle celebratory moment on completion;
- keep it fast and non-blocking;
- do not turn the session into a noisy arcade effect.

For manual review and extra study:

- use the same structural summary surface;
- do not use the same strong completion semantics as the main due-review ritual.

### 3. Visual language

The completion screen must stay inside the current design system:

- use shared card/badge/button primitives;
- support mobile layouts cleanly;
- motion should be restrained and functional.

### 4. Refresh resilience

If the review route refreshes after the last submitted rating:

- the user must still see the finished-session summary;
- the app must not replace that summary with a generic "no cards due" empty state;
- this must hold for the session that was just completed, even if the underlying due queue is now empty on the server.

## Acceptance Criteria

- [ ] Regular due completion shows a richer summary than the current count + accuracy line.
- [ ] The screen includes answer distribution, time spent, and short explanatory copy.
- [ ] The due-review completion state feels rewarding without becoming noisy.
- [ ] Manual review and extra study use appropriate non-due messaging.
- [ ] After the last review submission, the route must not fall back to the generic empty queue screen for that finished session.
- [ ] The completion surface works on desktop and mobile.
- [ ] Reusable user-visible UI is reflected in Storybook when practical.
