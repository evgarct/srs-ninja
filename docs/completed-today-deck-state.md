# Completed-Today Deck State

## Summary

Home deck cards can now show a deck-specific success state when the user has already completed a meaningful study session for that deck today.

This is backed by a persisted completion marker instead of a heuristic derived from generic review activity.

## Files

- `supabase/migrations/20260320193000_review_session_completions.sql`
- `src/lib/actions/decks.ts`
- `src/components/review-session.tsx`
- `src/components/home-deck-card.tsx`
- `src/components/home-deck-card.stories.tsx`
- `src/app/page.tsx`

## Source of Truth

A new table, `review_session_completions`, stores completion events for review sessions.

For this feature, the product writes a completion row when:

- a regular due-review session reaches its done state;
- an extra-study session reaches its done state;
- all pending review submissions have finished;
- no sync error remains.

The stored row includes:

- `user_id`
- `deck_id`
- `session_type`
- `completed_at`

## Product Semantics

`Completed today` means:

- the user completed the regular due-review session or an extra-study session for that deck today;
- manual review does not mark the deck as completed-today;

This is intentionally a motivational status layer, not a guarantee that the deck cannot have more due cards later the same day.

## Dashboard Behavior

`getDashboardStats(timeZone)` now loads same-day completion rows and exposes `completedToday` per deck.

That allows the home card to:

- show a calm success chip in the title row;
- keep the existing due CTA if due work is still visible;
- pass deck-specific `hasStudiedToday` state to `ExtraStudyBox` instead of the previous global same-day activity heuristic.

## UI Pattern

The new `HomeDeckCard` component keeps the existing dashboard card structure and adds:

- a compact completed-today chip;
- a single clear primary CTA per state.
- a consistent action row pattern where the primary learning CTA expands and `Open deck` stays on the right as the secondary action.

For idle states, the card keeps the same action-row structure as due states: the primary `Continue learning` CTA expands to fill available space, and `Open deck` remains the secondary action on the right. Extra-study sizing options are exposed from a dropdown attached to the primary CTA instead of expanding the card vertically.
If a deck is already marked as completed today but due work becomes visible again, the completed chip stays visible and the primary CTA switches back to the direct due-review route instead of showing the extra-study dropdown.

The component intentionally avoids:

- replacing the entire deck card pattern;
- introducing a new marketing-style visual language;
- hiding due work when it still exists.
