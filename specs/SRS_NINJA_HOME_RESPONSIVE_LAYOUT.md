# Echo - Feature: Responsive-First Home Layout

## Goal

Keep Home focused on the next review action instead of dashboard decoration.

## Product Rules

### 1. One mobile navigation layer

On mobile, non-review screens must not show both a top navigation bar and a bottom navigation bar at the same time.

Allowed:

- one fixed bottom navigation bar with the main destinations;
- create and overflow actions inside that same mobile nav surface.

### 2. Desktop shell remains separate

Desktop may keep the floating top navigation shell.

This does not justify duplicating that shell on mobile.

### 3. Home starts with decks, not copy

Home should not open with a decorative `Home` heading, a subtitle like `What to study next`, or a hero/status block.

The first meaningful surface should be the deck list itself.

### 4. Deck cards stay minimal

Each deck card must keep:

- deck identity;
- one due signal;
- one primary review CTA;
- one secondary open-deck CTA.

Avoid adding section titles, dashboard KPIs, or duplicated status copy above those cards.

## Acceptance Criteria

- [ ] Mobile non-review routes use a single navigation layer.
- [ ] Desktop keeps the floating top shell.
- [ ] Review routes do not render the global shell navigation.
- [ ] Home no longer shows the `Home / What to study next` heading block.
- [ ] The deck grid is the first primary actionable surface on Home.
