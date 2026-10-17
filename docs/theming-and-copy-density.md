# Light/Dark/System Theming & Copy-Density Pass

## Summary

Wires up `next-themes` (previously an unused dependency) for a real Light/Dark/System toggle, redesigns the light token palette to match the brand, re-tokenizes the app's core surfaces away from hardcoded dark colors, and trims restated/explanatory copy on the densest screens.

## Theme infrastructure

- `src/app/layout.tsx`: `<html>` no longer hardcodes `className="dark"`. It's wrapped in `next-themes`'s `ThemeProvider` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`), with `suppressHydrationWarning` on `<html>` (required by next-themes).
- `src/components/theme-toggle-menu.tsx`: `ThemeMenuItems`, a `DropdownMenuRadioGroup` of Light/Dark/System (`Sun`/`Moon`/`Monitor` icons from `lucide-react`), driven by `useTheme()`. Mounted in `nav.tsx`'s shared `overflowMenu` JSX (used by both the desktop and mobile dropdowns), next to the existing language picker.
- New translation keys `nav.themeLight` / `themeDark` / `themeSystem` across all 4 locales.
- `src/components/nav.tsx`'s `BrandLogo` tone now tracks `useTheme().resolvedTheme` (falls back to the dark-bg "inverse" tone until the provider resolves, matching `defaultTheme="dark"` — avoids a flash of the wrong logo color).

## Light palette

`src/app/globals.css`'s `:root` block was generic shadcn gray; it's now a warm-lavender/brand-gold palette mirroring the same hue families used by `.dark` (285/292/300/305/109) at inverted lightness, so both themes read as the same product. The decorative `body` background-image, `.app-panel`, `.app-panel-muted`, `.app-pill`, and `.app-grid-glow` utility classes now have both a light and a `.dark`-scoped rendering (or use `foreground`-relative opacity, which auto-inverts between themes without needing a separate `dark:` pair).

## Re-tokenized surfaces

`nav.tsx`, `page.tsx` (home) + `home-deck-card.tsx` + `home-deck-list.tsx` + `extra-study-box.tsx`, `review-session.tsx`, `Flashcard.tsx`, `RatingButtons.tsx` (the floating rating-dock tones now have light/dark pairs), `review-session-complete.tsx`, `vendor/reactbits-review-stack.tsx` (ghost cards), `stats/page.tsx`, `activity/WeeklyActivity.tsx`, `activity/ReviewHeatmap.tsx` — all replaced `bg-black`/`text-white`/`bg-[#...]` literals with the app's semantic tokens (`bg-background`, `text-foreground`, `border-foreground/N`, etc.) or an explicit `dark:` pair where the light/dark treatment is genuinely different (e.g. the ambient glow intensity).

**Not** re-tokenized in this pass (intentional, documented follow-up): `elevenlabs-settings-view.tsx`'s body/structure (only its copy was trimmed — see below), `deck-page-client.tsx`'s table/toolbar styling (only its copy was trimmed).

## Storybook

`.storybook/preview.tsx` adds a `theme` global with a toolbar control (Dark/Light, defaulting to Dark). The decorator wraps every story in a real `next-themes` `ThemeProvider` (`key={theme}` so it remounts and its internal state matches the toolbar — `defaultTheme` alone doesn't update an already-mounted provider), so components reading `useTheme()` (like the nav's logo tone) render correctly in both toolbar states, not just the CSS class.

Several component stories (`nav.stories.tsx`, `home-deck-card.stories.tsx`, `home-deck-list.stories.tsx`, `activity/ReviewHeatmap.stories.tsx`, `activity/WeeklyActivity.stories.tsx`, `review-session.stories.tsx`, `review-session-complete.stories.tsx`, `i18n/EmptyStates.stories.tsx`) had their own hardcoded `dark`/`bg-[#...]` wrapper divs removed, since they now inherit the theme from the global decorator. `Flashcard.stories.tsx`'s dedicated `LightTheme`/`DarkTheme` demo stories are untouched — they intentionally force a specific theme regardless of the toolbar.

## Copy trims

- Home (`page.tsx`): empty state drops its second sentence, keeps a short title + `Library` icon. `home-deck-card.tsx` drops the separate language-pair text eyebrow (the flag + deck name already carry it).
- `extra-study-box.tsx`: previously hardcoded English strings are now translated (`home.continueLearning`, `home.extraStudy`, `home.addCards`).
- `review-session-complete.tsx`: the per-mode `manualBody`/`extraBody`/`dueBody` explanatory sentences are removed; badge + title + the stat tiles stand alone.
- `elevenlabs-settings-view.tsx`: the 3-step onboarding card drops its per-step description sentence (icon + short title only); the bottom `voiceIdValidation` implementation-detail sentence is removed.
- `stats/page.tsx`: the page header's `shortDescription` paragraph is removed entirely; the "streak goal" section drops its redundant `{streak} streak` pill (the number is already in the top stat tile).
- `activity/WeeklyActivity.tsx`: drops the per-day reviews-count number row (the cell glyph/color already encodes activity level).
- `activity/ReviewHeatmap.tsx`: its previously hardcoded, non-i18n two-sentence empty state is now a single translated line (`stats.heatmapEmpty`).
- `deck-page-client.tsx`: the empty state drops its hint sentence (the two buttons right below it already say "add note" / "import"); the notes-table section drops the redundant "Notes table" label, keeping only the (still-useful, filter-aware) "showing N notes" line.

Every removed translation key (`home.createFirst`, `reviewCompletion.manualBody`/`extraBody`/`dueBody`, `elevenlabsSettings.stepKeyDescription`/`stepConnectDescription`/`stepVoicesDescription`/`voiceIdValidation`, `stats.shortDescription`, `deck.noNotesHint`/`notesTable`) was removed from all 4 locale files, not just unused in code.

## Known limitation

This environment has no Supabase credentials configured, so the real Next dev server (`npm run dev`) can't be exercised end-to-end here; verification was done via Storybook (which covers all re-tokenized components) plus code review of the `next-themes` wiring in `layout.tsx`. The "System" option's live OS-preference following was not independently verified end-to-end for the same reason — it relies on `next-themes`' own documented `enableSystem` behavior.
