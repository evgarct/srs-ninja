# Echo - Feature: Review Queue Pacing

## Context

Regular due review currently feels artificially constrained and too repetitive:

- due-session launch fetches only a small fixed slice of due cards;
- difficult cards return by a simple fixed near-front reinsertion pattern;
- the queue can feel more mechanical than Anki-like.

This weakens trust in the review flow and makes difficult cards feel annoying instead of pedagogically useful.

## Goal

Make the regular due-review session feel closer to Anki's daily review behavior without cloning Anki UI:

- use an Anki-like daily review limit instead of the current tiny-feeling launch cap;
- keep failed and difficult cards inside the active learning loop;
- bring those cards back later with breathing room instead of almost immediately;
- preserve fast session flow and alignment with the existing FSRS scheduler.

## Product Rules

### 1. Daily due-session limit

For regular due review:

- session launch should support up to `200` due cards;
- this is the product-level default maximum reviews/day behavior for now;
- manual review and extra study do not inherit this cap automatically.

### 2. New card limit

For regular due review:

- new cards remain separately capped at `20` per session;
- this cap is distinct from the due review limit.

### 3. Difficult-card reinsertion

For any active review-session queue:

- `Again` returns the current card later in the same queue;
- `Hard` also returns the current card later in the same queue, and later than `Again`;
- `Good` and `Easy` remove the card from the active queue.

The reinsertion should:

- avoid the current fixed offsets (`1` and `3`);
- use a delayed reinsertion window based on remaining queue length;
- allow slight bounded variation so the pattern is not deterministic and annoying;
- still preserve the basic expectation that `Again` comes back sooner than `Hard`.

### 4. Shared mechanics

The learning-loop behavior must remain aligned across:

- regular due review;
- manual filtered review;
- extra study.

Session entry mode may still control which cards are gathered initially, but the in-session queue mechanics should not silently diverge.

### 5. Scheduler integrity

This feature must not rewrite or replace the existing FSRS scheduling engine.

- `ts-fsrs` remains the source of truth for scheduling;
- this task only changes queue policy and pacing around the active session.

## Acceptance Criteria

- [ ] Regular due review supports up to `200` due cards per session launch.
- [ ] Regular due review still caps new cards at `20`.
- [ ] `Again` returns a card later in the active queue without the current fixed near-front pattern.
- [ ] `Hard` returns later than `Again`.
- [ ] `Good` and `Easy` release the card from the active queue.
- [ ] Queue pacing logic is covered by automated tests.
- [ ] Manual review and extra study keep the same active learning-loop mechanics unless explicitly documented otherwise.
- [ ] The FSRS scheduling engine remains unchanged.
