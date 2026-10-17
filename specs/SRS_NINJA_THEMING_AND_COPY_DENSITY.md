# Echo - Feature: Light/Dark/System Theming & Copy-Density Pass

## Context

Echo was dark-only: `<html>` hardcoded the `.dark` class, `next-themes` was an installed-but-unused dependency, and roughly a hundred places across the app used literal dark colors (`bg-black`, `text-white`, `bg-[#090511]`) instead of the app's own semantic design tokens. The light (`:root`) token block was untouched generic shadcn gray, never designed against Echo's actual purple/gold brand palette.

Several screens were also copy-dense: Stats repeated the streak number three times with an explanatory paragraph that argued against its own existence, the review-completion screen stacked a full sentence under every badge, the ElevenLabs onboarding card paired three icons with three full sentences before the user did anything, and empty states routinely paired a title sentence with a redundant hint sentence right above the buttons that already said the same thing.

## Goal

Give the user a real light/dark/system theme choice that looks intentional (not just "the dark palette inverted"), and reduce text density on the highest-traffic screens toward short, icon-led labels — without changing underlying product behavior.

## Product Rules

### 1. Theme selection

The nav's overflow menu offers Light / Dark / System, next to the existing language picker, using `next-themes`. The choice persists (next-themes' own `localStorage` persistence) and "System" follows the OS/browser `prefers-color-scheme`.

### 2. Light palette

The light theme is a deliberately designed brand palette (warm-lavender background, a darkened brand gold-green primary readable on white, consistent chart-color family) — not the generic shadcn gray scaffold.

### 3. Theming scope, staged

This pass gives full light/dark parity to the **core** surfaces: global shell (`globals.css` decorative layer), nav, home (deck list), review/flashcard (reveal, rating, depth stack, completion screen), and stats (including weekly activity and the review heatmap). Secondary screens — ElevenLabs settings, the deck notes table/toolbar, dialogs beyond what already used tokens — are **not** re-themed in this pass; they keep rendering with their existing dark-only colors regardless of the selected theme until a follow-up pass converts them. This is a known, intentional limitation, not a bug.

### 4. Copy density

Explanatory/restating sentences are removed where a short title, icon, or an adjacent control already carries the meaning: empty states (home, deck notes, review heatmap), the review-completion screen's per-mode body sentence, the ElevenLabs onboarding step descriptions, and the deck notes empty state's hint line. One-line hints that carry unique information (e.g. a single validation warning, filtered-result counts) are kept.

## Acceptance Criteria

- [x] The nav overflow menu has a working Light/Dark/System control.
- [x] The light theme uses a brand-consistent palette, not default shadcn gray.
- [x] Nav, home deck list, the review/flashcard flow (including the depth stack, rating reaction, and completion screen), and stats are fully readable and correctly colored in both themes.
- [x] Storybook previews both themes via a toolbar control, defaulting to dark to match the app's `defaultTheme`.
- [x] Empty states, the review-completion screen, and the ElevenLabs onboarding card no longer carry a redundant explanatory sentence alongside a title/icon that already conveys the same thing.
- [x] No translation key was left orphaned by a copy trim.
- [x] Secondary screens not covered by this pass (ElevenLabs settings body, deck notes table) are documented as dark-only follow-up work, not silently incomplete.
