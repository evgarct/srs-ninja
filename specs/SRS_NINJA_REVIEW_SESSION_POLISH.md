# Echo - Feature: Review Session Polish

## Context

The core review session already works, but it still feels visually plain:

- progress framing is minimal;
- the session has little sense of flow or stack depth;
- card progression is fast but visually abrupt.

The product needs a calmer, more premium-feeling review surface without changing the underlying study mechanics.

## Goal

Improve the review-session shell so it feels more intentional and alive while staying fast, readable, and system-aligned.

## Product Rules

### 1. Progress framing

The top of the session should communicate:

- current session type;
- current progress;
- remaining queue context.

This should be visible at a glance on desktop and mobile.

### 2. Card flow

The current card should feel like part of a live queue, not an isolated static slab.

Allowed cues:

- subtle stack depth;
- soft card entry / exit transitions;
- restrained motion around current-card changes.

### 3. Motion

Motion must be:

- subtle;
- fast;
- non-blocking;
- compatible with reading and tapping speed.

No decorative looping animation should distract from the review task.

## Acceptance Criteria

- [ ] Review-session header gives stronger progress context.
- [ ] Current-card progression feels smoother than the old abrupt swap.
- [ ] The session shows subtle stack / queue depth cues without reducing readability.
- [ ] The updated session works on desktop and mobile.
- [ ] Visual changes remain inside the existing design system and do not create a parallel visual language.
