# Echo - Feature: Review Queue Pacing

## Context

Users can feel that training words arrive in roughly the same order they were added, even though the queue already applies some in-session shuffling.

The main problem is upstream:

- regular due review trims the SQL result too early;
- extra study takes the oldest new cards too literally;
- the ordering layer does not get enough candidate variety to build a natural-feeling session.

## Goal

Make review sessions feel more random and less insertion-ordered without breaking SRS scheduling rules.

## Product Rules

### 1. Wider due candidate pool

Regular due review must fetch a wider candidate pool than the visible due-session limit.

The product may still keep a visible session cap, but ordering should run before the final trim.

### 2. Final trim happens after ordering

For regular due review:

- fetch candidate cards;
- run tier ordering and sibling separation;
- only then trim to the configured visible session size.

### 3. Extra study should not feel insertion-ordered

When extra study selects new cards, it should not simply take the first `N` by `created_at`.

It may still anchor itself in older unseen cards first, but the final picked set should feel shuffled.

### 4. Scheduler integrity

This feature must not change the stored FSRS scheduling rules.

Allowed:

- changing which due cards enter the current session;
- changing how the current in-memory session queue is assembled.

Not allowed:

- changing interval computation;
- changing how `submitReview()` persists ratings.

## Acceptance Criteria

- [ ] Regular due review fetches a wider candidate pool than the visible session limit.
- [ ] Regular due review trims only after ordering.
- [ ] Extra study no longer feels strictly ordered by insertion time.
- [ ] The FSRS scheduler remains unchanged.
- [ ] Candidate-pool and final-trim behavior are covered by automated tests.
