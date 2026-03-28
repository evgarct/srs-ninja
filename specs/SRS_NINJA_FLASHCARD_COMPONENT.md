# Echo — Feature: Flashcard Component

## Context

Echo is a spaced repetition app (Next.js + Supabase + shadcn/ui + Storybook).
Phase 0 is done: project scaffolded, auth working, DB schema deployed.

This task: build the **Flashcard** component — the core UI element for card review sessions.

---

## Design Direction

- **NOT necessarily dark mode** — must support both light and dark themes via CSS variables
- Clean, modern, card-based design — NOT generic "AI look"
- Inspired by the existing Anki dark theme cards (screenshots provided in Notion) but elevated
- Use shadcn/ui primitives where it makes sense, custom styling where needed
- Think editorial/refined, not flashy

---

## What to Build

### 1. Flashcard Component (`src/components/flashcard/Flashcard.tsx`)

A React component with these props:

```typescript
interface FlashcardProps {
  // Content
  expression: string
  translation: string
  examples: string[] // 2 sentences, may contain <b> tags
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  partOfSpeech: string
  gender?: string // Czech only (mužský, ženský, střední)
  frequency: number // 1-10
  style: string // e.g. '🎓 Neutrální' or '🎓 Neutral / Folklore or fantasy object'
  note?: string // Grammar note, Czech only (e.g. 'č. mn.: konve')
  audioUrl?: string
  imageUrl?: string
  language: 'czech' | 'english'

  // State
  direction: 'recognition' | 'production'
  isRevealed: boolean
  onReveal: () => void
  onRate: (rating: 1 | 2 | 3 | 4) => void
  onPlayAudio?: () => void

  // FSRS scheduling info (shown on rating buttons)
  intervals?: {
    again: string // e.g. '<10m'
    hard: string  // e.g. '<15m'
    good: string  // e.g. '18d'
    easy: string  // e.g. '29d'
  }
}
```

### 2. Four Visual States

#### Recognition Front (foreign → native, before reveal)
- ▶ Play button (circle with icon) + **expression** (large, bold, ~24-28px)
- Colored gradient accent line under expression
- 2 example sentences as bullet list, target word in **bold** (render HTML from <b> tags)
- Badge row: Level badge (color square + text) • Part of speech • Gender (underlined, Czech only)
- Frequency bar: ▰▰▰▰▰▰▰▱▱▱ 7/10
- Style label with emoji
- Grammar note (Czech only, bottom)
- Translation is HIDDEN

#### Recognition Back (after reveal)
- Same as front, PLUS:
- **Translation** appears in parentheses below expression with underline accent
- No layout shift — translation area should be reserved or animated in smoothly

#### Production Front (native → foreign, before reveal)
- **Translation** (large, bold) — this is the Russian word
- Gradient accent line
- Badge row: Level • Part of speech • Gender
- Frequency bar
- Style label
- Grammar note (Czech only)
- Expression, Play button, and Examples are HIDDEN

#### Production Back (after reveal)
- ▶ Play button + **Expression** appears (large, bold)
- **Translation** in parentheses below
- Examples appear
- All metadata stays

### 3. Rating Buttons (shown after reveal)

Four buttons in a row at the bottom:
- **Again** — red/destructive — shows interval (e.g. "<10m")
- **Hard** — orange/warning — shows interval (e.g. "<15m")
- **Good** — green/success — shows interval (e.g. "18d")
- **Easy** — blue/primary — shows interval (e.g. "29d")

Each button has label on top, interval below.

### 4. Keyboard Shortcuts

- **Space** or **click on card** = reveal answer
- **1** = Again, **2** = Hard, **3** = Good, **4** = Easy (after reveal)

### 5. Sub-components to extract

- `LevelBadge` — colored square + CEFR text (🟩 A1, 🟨 A2, 🟦 B1, 🟪 B2, 🟧 C1, 🟣 C2)
- `FrequencyBar` — 10-block visual bar + number
- `PlayButton` — circular audio play button
- `RatingButtons` — 4-button rating row with intervals
- `ExamplesList` — renders 2 example sentences with bold target words

### 6. Theme Support

- Use CSS variables for colors
- Support both light and dark themes
- Card surface should contrast with page background
- Level badge colors stay consistent across themes

---

## CEFR Level Colors

```
A1 → green    (#22c55e / green-500)
A2 → yellow   (#eab308 / yellow-500)
B1 → blue     (#3b82f6 / blue-500)
B2 → purple   (#a855f7 / purple-500)
C1 → orange   (#f97316 / orange-500)
C2 → violet   (#7c3aed / violet-600)
```

---

## Storybook Stories (`src/components/flashcard/Flashcard.stories.tsx`)

Create stories for ALL these variants:

```
Czech Recognition Front
Czech Recognition Back
Czech Production Front
Czech Production Back
English Recognition Front
English Recognition Back
English Production Front
English Production Back
With Audio (has play button)
Dark Theme
Light Theme
All CEFR Levels (A1–C2 side by side)
Rating Buttons Visible
```

### Sample Data

Czech:
```json
{
  "expression": "konev",
  "translation": "лейка",
  "examples": [
    "Na zahradě jsme použili <b>konev</b> na zalévání květin.",
    "Děti si hrály s vodou z <b>konve</b>."
  ],
  "level": "A1",
  "partOfSpeech": "podstatné jméno",
  "gender": "ženský",
  "frequency": 7,
  "style": "🎓 Neutrální",
  "note": "č. mn.: konve",
  "language": "czech"
}
```

English:
```json
{
  "expression": "cauldron",
  "translation": "котёл ведьмы",
  "examples": [
    "The witch stirred her bubbling <b>cauldron</b>.",
    "Smoke rose from the <b>cauldron</b> filled with a strange potion."
  ],
  "level": "B1",
  "partOfSpeech": "noun",
  "frequency": 4,
  "style": "🎓 Neutral / Folklore or fantasy object",
  "language": "english"
}
```

---

## Important Notes

- Use shadcn/ui `Card`, `Badge`, `Button` as base, customize heavily
- Examples contain HTML `<b>` tags — use `dangerouslySetInnerHTML` or parse safely
- Gender field ONLY shown for Czech cards
- Note/Poznámka field ONLY shown for Czech cards
- Play button ONLY shown when expression is visible and audioUrl exists
- No actual audio playback yet — just wire up `onPlayAudio` callback
- Component should be responsive (works on mobile and desktop)
- Create each sub-component separately with its own story
- Frequency bar: filled blocks vs empty blocks, not a progress bar

---

## File Structure

```
src/components/flashcard/
├── Flashcard.tsx
├── Flashcard.stories.tsx
├── LevelBadge.tsx
├── LevelBadge.stories.tsx
├── FrequencyBar.tsx
├── FrequencyBar.stories.tsx
├── PlayButton.tsx
├── PlayButton.stories.tsx
├── RatingButtons.tsx
├── RatingButtons.stories.tsx
├── ExamplesList.tsx
├── ExamplesList.stories.tsx
└── index.ts
```

---

## Acceptance Criteria

- [ ] All 4 states render correctly for Czech cards
- [ ] All 4 states render correctly for English cards
- [ ] Gender shown only for Czech
- [ ] Note/Poznámka shown only for Czech
- [ ] Play button shown only when expression visible + audioUrl exists
- [ ] Rating buttons appear after reveal with interval labels
- [ ] Space key reveals, 1-4 keys rate
- [ ] Light and dark theme both look good
- [ ] All Storybook stories render without errors
- [ ] No layout shift when transitioning from front to back
- [ ] Sub-components have their own stories
- [ ] Mobile responsive
