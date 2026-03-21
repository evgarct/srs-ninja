# SRS Ninja - Feature: Review Session Mobile App Pass

## Context

The earlier review-session polish improved progress framing and basic card motion, but the mobile review flow still feels like a web page:

- too much vertical chrome appears before the main action;
- rating buttons can sit too low on the screen after reveal;
- the card content and metadata feel visually heavy on phones;
- motion is smoother than before, but it still does not feel like a focused app screen.

## Goal

Make the mobile review session feel mobile-app-first while preserving the existing review mechanics and card content model.

## Product Rules

### 1. App-style composition

On mobile, the review session should read as a single focused screen:

- compact session chrome at the top;
- one primary card stack in the middle;
- always-reachable actions at the bottom.

### 2. Reachable actions

After reveal, rating actions must remain available without extra scrolling.

The bottom action area should:

- respect safe-area insets;
- feel tactile and intentional;
- remain visually subordinate to the card, but clearly reachable.

### 3. Lower mobile density

The card content model stays unchanged, but the mobile presentation should reduce overload:

- main learning content remains dominant;
- lower-priority details can be delayed or visually softened;
- spacing should feel tighter and more app-like on phones.

### 4. Directional motion

Card motion should be tied to the chosen answer:

- `Again` and `Hard` leave toward the negative side;
- `Good` and `Easy` leave toward the positive side;
- the next card rises into focus from the stack.

### 5. Interactive references

Use Magic UI and React Bits as pattern references for interaction quality, not as wholesale styling imports.

Safe reference areas:

- short emoji or particle bursts;
- tactile press feedback;
- compact action surfaces;
- directional card transitions.

Avoid:

- decorative ambient motion;
- heavy animated backgrounds;
- a parallel visual language disconnected from the current product.

## Acceptance Criteria

- [ ] On mobile, rating actions are visible and reachable immediately after reveal without requiring extra scrolling.
- [ ] The mobile session chrome is more compact than the previous review-session polish version.
- [ ] The review screen reads as a focused app-like surface instead of a stacked document.
- [ ] The card remains the main focal element on mobile.
- [ ] Current-card exit direction matches the chosen rating.
- [ ] The next card enters from the stack with fast, readable motion.
- [ ] Any emoji or particle burst is brief, low-noise, and does not interrupt rapid review.
- [ ] Review mechanics stay aligned across regular review, manual review, and extra study.
- [ ] Storybook reflects the updated mobile review states where practical.
- [ ] Mobile QA covers safe-area handling, touch targets, spacing, and perceived responsiveness.
