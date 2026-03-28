# Echo — Bug Fix: Cards display dashes instead of text + Review Page

## Bug Report

Cards in the app display long dashes (em-dashes or placeholder lines) instead of actual English words. The data in Supabase is correct — fields like `expression`, `translation`, etc. are properly stored in the `fields` JSONB column.

### Root Cause Investigation

The Flashcard component (`src/components/flashcard/Flashcard.tsx`) expects props like `expression`, `translation`, etc. The bug is likely in the **page that reads data from Supabase and passes it to the Flashcard component**. 

Check these files for the issue:
- `src/app/page.tsx` or wherever cards are rendered
- `src/app/decks/[id]/review/page.tsx` (if exists)
- Any data fetching layer that reads from `notes` table

### How data is stored in Supabase

The `notes` table has a `fields` JSONB column. Example:

```json
{
  "expression": "root cause",
  "translation": "первопричина",
  "examples": [
    "We must identify the <b>root cause</b> of the failure before fixing anything.",
    "The <b>root cause</b> turned out to be a misconfigured server."
  ],
  "level": "B1",
  "part_of_speech": "collocation",
  "frequency": 6,
  "style": "🧠 Formal / Common in business and technical contexts",
  "synonyms": ["underlying cause", "primary reason", "origin"],
  "antonyms": ["symptom", "effect"]
}
```

### How to map fields to Flashcard props

```typescript
// When fetching from Supabase:
const note = await supabase.from('notes').select('*, cards(*)').single()

// Map to Flashcard props:
<Flashcard
  expression={note.fields.expression}
  translation={note.fields.translation}
  examples={note.fields.examples || []}
  level={note.fields.level || 'A1'}
  partOfSpeech={note.fields.part_of_speech || ''}
  gender={note.fields.gender}
  frequency={note.fields.frequency || 5}
  style={note.fields.style || ''}
  note={note.fields.note}
  language={deck.language}
  // ... state props
/>
```

### Key field names in JSONB

| JSONB key | Flashcard prop |
|---|---|
| `fields.expression` | `expression` |
| `fields.translation` | `translation` |
| `fields.examples` | `examples` |
| `fields.level` | `level` |
| `fields.part_of_speech` | `partOfSpeech` |
| `fields.gender` | `gender` |
| `fields.frequency` | `frequency` |
| `fields.style` | `style` |
| `fields.note` | `note` |
| `fields.synonyms` | (new, display on card) |
| `fields.antonyms` | (new, display on card) |

---

## Task 1: Fix the data mapping bug

Find where Supabase data is fetched and passed to the Flashcard component. Ensure all `fields.*` values are correctly mapped to Flashcard props. The JSONB field names listed above are the source of truth.

---

## Task 2: Build a Review Session Page

Create a proper review session page at `/app/decks/[id]/review/page.tsx`.

### Data Flow

1. Fetch all due cards for the deck: `cards WHERE user_id = X AND deck_id = Y AND due_at <= now() AND state IN ('new', 'learning', 'review', 'relearning')`
2. Join with notes to get fields: `notes.fields`, `notes.tags`
3. Join with decks to get language
4. Show one card at a time using Flashcard component
5. After rating → update card FSRS state → show next card
6. When no more due cards → show "Done for today!" screen

### Query to get due cards

```sql
SELECT 
  c.id as card_id,
  c.card_type,
  c.state,
  c.stability,
  c.difficulty,
  c.elapsed_days,
  c.scheduled_days,
  c.reps,
  c.lapses,
  c.last_review,
  c.due_at,
  n.fields,
  n.tags,
  d.language
FROM cards c
JOIN notes n ON n.id = c.note_id
JOIN decks d ON d.id = n.deck_id
WHERE c.user_id = '{user_id}'
  AND n.deck_id = '{deck_id}'
  AND c.due_at <= now()
ORDER BY c.due_at ASC;
```

### FSRS Integration

Use `ts-fsrs` to calculate next intervals when user rates a card:

```typescript
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs'

const f = fsrs(generatorParameters())

// Convert DB card to ts-fsrs card
const fsrsCard = {
  due: new Date(card.due_at),
  stability: card.stability,
  difficulty: card.difficulty,
  elapsed_days: card.elapsed_days,
  scheduled_days: card.scheduled_days,
  reps: card.reps,
  lapses: card.lapses,
  state: card.state === 'new' ? 0 : card.state === 'learning' ? 1 : card.state === 'review' ? 2 : 3,
  last_review: card.last_review ? new Date(card.last_review) : undefined,
}

// Get scheduling for all 4 buttons
const now = new Date()
const scheduling = f.repeat(fsrsCard, now)

// scheduling[Rating.Again] → { card: {...}, log: {...} }
// scheduling[Rating.Hard]  → { card: {...}, log: {...} }
// scheduling[Rating.Good]  → { card: {...}, log: {...} }
// scheduling[Rating.Easy]  → { card: {...}, log: {...} }

// After user rates, update card in Supabase:
const result = scheduling[userRating]
await supabase.from('cards').update({
  stability: result.card.stability,
  difficulty: result.card.difficulty,
  elapsed_days: result.card.elapsed_days,
  scheduled_days: result.card.scheduled_days,
  reps: result.card.reps,
  lapses: result.card.lapses,
  state: ['new', 'learning', 'review', 'relearning'][result.card.state],
  last_review: now.toISOString(),
  due_at: result.card.due.toISOString(),
}).eq('id', card.card_id)

// Also insert review log:
await supabase.from('reviews').insert({
  card_id: card.card_id,
  user_id: userId,
  rating: userRating,
  state: card.state,
  scheduled_days: result.log.scheduled_days,
  elapsed_days: result.log.elapsed_days,
  reviewed_at: now.toISOString(),
})
```

### Intervals Display

Before reveal, calculate intervals for all 4 buttons and pass to Flashcard:

```typescript
// Format interval for display
function formatInterval(days: number): string {
  if (days < 1/24/60) return '<1m'
  if (days < 1/24) return `${Math.round(days * 24 * 60)}m`
  if (days < 1) return `${Math.round(days * 24)}h`
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

const intervals = {
  again: formatInterval(scheduling[Rating.Again].card.scheduled_days),
  hard: formatInterval(scheduling[Rating.Hard].card.scheduled_days),
  good: formatInterval(scheduling[Rating.Good].card.scheduled_days),
  easy: formatInterval(scheduling[Rating.Easy].card.scheduled_days),
}
```

### Review Session UI

```
/app/decks/[id]/review/page.tsx
```

- Header: deck name + progress (3/25 cards)
- Center: Flashcard component
- When done: summary screen (cards reviewed, time spent)
- Back button to deck list

### New Card Fields: Synonyms & Antonyms

The Flashcard component needs to also display `synonyms` and `antonyms` from `note.fields`. Add these as optional pills/tags below the examples:

```typescript
// Add to FlashcardProps:
synonyms?: string[]
antonyms?: string[]

// Display as comma-separated tags:
// Synonyms: origin, source, basis, foundation
// Antonyms: surface, result
```

Show synonyms/antonyms only after reveal (on the back of the card).

---

## Task 3: Home Page — Show Due Counts

Update `src/app/page.tsx` to show actual due card counts per deck:

```sql
SELECT 
  d.id, d.name, d.language,
  COUNT(c.id) FILTER (WHERE c.due_at <= now()) as due_count,
  COUNT(c.id) as total_cards
FROM decks d
LEFT JOIN notes n ON n.deck_id = d.id
LEFT JOIN cards c ON c.note_id = n.id
WHERE d.user_id = '{user_id}'
GROUP BY d.id, d.name, d.language;
```

Each deck card on the home page should show:
- Deck name with flag emoji (🇨🇿 / 🇬🇧)
- Due count: "25 cards due"
- Total cards in deck
- Click → navigate to `/decks/{id}/review`

---

## Supabase Config (for reference)

```
Project ID: cwcnrfpllkmipipjtkvm
URL: https://cwcnrfpllkmipipjtkvm.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3Y25yZnBsbGttaXBpcGp0a3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzU5ODgsImV4cCI6MjA4OTAxMTk4OH0.G94cwdZ_Nj1UsRsmUuuuBrZAzVdNWs67uhxJhJzBgfw

Deck IDs:
- Czech: 69b0bf5f-38e0-4fa1-8c44-0922cb403661
- English: 642b2b4d-2d54-41f5-851e-fc020cc37ea0
```

---

## Acceptance Criteria

- [ ] Cards display actual words, not dashes
- [ ] Flashcard props correctly mapped from `note.fields` JSONB
- [ ] Review session page works at `/decks/[id]/review`
- [ ] Due cards fetched and shown one at a time
- [ ] FSRS scheduling via `ts-fsrs` library
- [ ] Rating updates card state in Supabase
- [ ] Review history saved to `reviews` table
- [ ] Interval labels shown on rating buttons (e.g. "18d", "<10m")
- [ ] "Done for today" screen when no more due cards
- [ ] Home page shows actual due counts per deck
- [ ] Click deck → navigates to review session
- [ ] Synonyms and antonyms displayed on card back
- [ ] Keyboard shortcuts work (Space to reveal, 1-4 to rate)
