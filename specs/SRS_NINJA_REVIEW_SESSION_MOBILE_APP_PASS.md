# Echo - Feature: Review Session UI Reset

## Goal

Keep the review session focused and controllable on both mobile and desktop.

## Product Rules

### 1. Review owns its own chrome

Review routes must not render the global app navigation shell.

The review session already has its own top-level controls and should not compete with a second app-level nav bar.

### 2. Temporary hide action

The current review card may be hidden from the active session.

This action is session-local only:

- it removes the card from the current queue;
- it does not submit a rating;
- it does not write review history;
- it does not mutate FSRS scheduling.

### 3. Completion must stay honest

If the queue reaches zero because the user graded the last card, the session may be marked completed.

If the queue reaches zero only because cards were hidden, the session must not be persisted as a completed review session.

## Acceptance Criteria

- [ ] Review routes do not show the global shell navigation.
- [ ] The current review card can be hidden from the current session.
- [ ] Hiding a card does not call the review submit action.
- [ ] Hiding a card does not mutate FSRS scheduling.
- [ ] Sessions emptied only through hidden cards are not persisted as completed review sessions.
- [ ] Queue-drop behavior is covered by automated tests.
