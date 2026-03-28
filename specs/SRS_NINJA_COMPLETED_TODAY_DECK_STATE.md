# Echo - Feature: Completed-Today Deck State

## Context

The home dashboard already hides cards that were reviewed earlier today from the main due CTA, but it still does not clearly tell the user that the main due-review session for a specific deck has already been completed today.

This makes the dashboard weaker as a motivation surface:

- the user cannot instantly see that today's important work for a deck is already done;
- the app can feel less rewarding after finishing a session;
- current same-day behavior is too global and not deck-specific.

## Goal

Show a deck-specific completed-today state on home deck cards when the user has completed a meaningful study session for that deck today.

## Product Rules

### 1. Definition

`Completed today` means:

- the user finished a **regular due-review session** or an **extra-study session** for that deck today;
- manual filtered review does not mark the deck as completed-today;

This state is a motivational success signal, not a promise that the deck can never produce more due work later the same day.

### 2. Persistence

The product must store a deck-specific completion marker when a regular due-review session or extra-study session is actually completed.

This should not be derived only from generic `reviews` rows or global activity totals.

### 3. Home card behavior

If a deck is completed today:

- the home card should show a clearly visible success state;
- the state should be understandable without opening the deck;
- the card should stay inside the existing dashboard design system.
- the success signal should not be duplicated by a second equivalent status block in the body of the card;
- the card should not rely on hover styling or colored background fills to communicate completion;
- the main CTA should not conflict with the completed state.

If the deck is idle after being completed today:

- the card should make it clear that the main due session is already finished;
- the next step should be a single clear continuation path;
- optional extra study may be offered as the primary forward action for that state;
- deck navigation may remain present as a secondary action when it follows the same action-row hierarchy used by the default deck card;
- if sizing options are offered for extra study, they should be revealed from the primary CTA without creating a second competing row of buttons;
- the UI should avoid making `Done today` feel false or self-contradictory.

If the deck is not completed today:

- the card keeps the current non-completed behavior.

### 4. Due work and completed state may coexist

If new due cards appear later the same day because of scheduler behavior:

- the card may still show the completed-today success state;
- the due CTA may still be present if there is visible due work.

## Acceptance Criteria

- [ ] Completing a regular due-review session stores a deck-specific completion marker.
- [ ] Completing an extra-study session stores a deck-specific completion marker for Home.
- [ ] Home dashboard queries and displays deck-specific completed-today state.
- [ ] Manual review does not mark the deck as completed-today.
- [ ] Completed-today state is visible on desktop and mobile without layout issues.
- [ ] Existing deck navigation and CTA behavior remain intact.
