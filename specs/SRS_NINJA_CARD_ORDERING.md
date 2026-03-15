# SRS Ninja — Feature: Smart Card Ordering

## Problem

Cards are currently shown in creation order. This means recognition and production cards from the same note appear back-to-back — user sees "root" then immediately "корень; начало, источник". This makes reviews predictable and defeats the purpose of spaced repetition.

## Solution

Implement a smart card ordering algorithm on the review session page.

### Rules

1. **Sibling separation**: Recognition and production cards from the SAME note must be separated by at least 5 other cards. If the deck has fewer than 10 due cards total, separate them as far as possible (put all recognition first, then all production, shuffled within each group).

2. **Shuffle within priority groups**: Don't show cards in creation order. Shuffle them, but respect priority tiers.

3. **Priority order** (higher priority shown first):
   - **Tier 1: Relearning** (`state = 'relearning'`) — cards you forgot, need immediate re-exposure
   - **Tier 2: Learning** (`state = 'learning'`) — cards currently being learned (short intervals)
   - **Tier 3: New** (`state = 'new'`) — never seen before
   - **Tier 4: Review** (`state = 'review'`) — mature cards due for review

   Within each tier, cards are shuffled randomly.

4. **New card limit**: Show maximum 20 new cards per session (configurable). This prevents overwhelming the user with too many new cards at once.

## Implementation

### Where to implement

In the review session page: `/app/decks/[id]/review/page.tsx` (or the data fetching layer)

### Algorithm pseudocode

```typescript
function orderCards(dueCards: Card[]): Card[] {
  // 1. Group by priority tier
  const relearning = shuffle(dueCards.filter(c => c.state === 'relearning'))
  const learning = shuffle(dueCards.filter(c => c.state === 'learning'))
  const review = shuffle(dueCards.filter(c => c.state === 'review'))
  let newCards = shuffle(dueCards.filter(c => c.state === 'new'))
  
  // 2. Limit new cards
  const NEW_CARD_LIMIT = 20
  newCards = newCards.slice(0, NEW_CARD_LIMIT)
  
  // 3. Concatenate in priority order
  let ordered = [...relearning, ...learning, ...newCards, ...review]
  
  // 4. Separate siblings (recognition + production from same note)
  ordered = separateSiblings(ordered, 5)
  
  return ordered
}

function separateSiblings(cards: Card[], minGap: number): Card[] {
  // For each card, check if a sibling (same note_id, different card_type) 
  // is within minGap positions. If so, move the later sibling further away.
  
  const result = [...cards]
  
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < Math.min(i + minGap + 1, result.length); j++) {
      if (result[i].note_id === result[j].note_id) {
        // Found sibling too close — move it to position i + minGap + 1 or end
        const [sibling] = result.splice(j, 1)
        const newPos = Math.min(i + minGap + 1, result.length)
        result.splice(newPos, 0, sibling)
        break
      }
    }
  }
  
  return result
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

### Data needed

The query for due cards already joins with notes table and returns `note_id` and `card_type` — these are what's needed for sibling detection.

```sql
SELECT 
  c.id as card_id,
  c.note_id,        -- needed for sibling detection
  c.card_type,      -- 'recognition' or 'production'
  c.state,          -- needed for priority grouping
  -- ... rest of fields
FROM cards c
JOIN notes n ON n.id = c.note_id
WHERE c.user_id = '{user_id}'
  AND n.deck_id = '{deck_id}'
  AND c.due_at <= now()
```

### Edge cases

- **Less than 10 due cards**: Can't maintain 5-card gap. Fall back to: all recognition cards (shuffled), then all production cards (shuffled).
- **Only 1 card due**: Just show it.
- **All cards are siblings** (e.g., 2 due cards, both from same note): Show recognition first, production second. No way around it.
- **Card becomes due mid-session** (user rates a card and it comes back in 10 minutes): Add to the end of the queue, maintaining sibling separation.

## Acceptance Criteria

- [ ] Cards are shuffled, not in creation order
- [ ] Recognition and production from same note never appear within 5 cards of each other
- [ ] Priority order: relearning → learning → new → review
- [ ] Maximum 20 new cards per session
- [ ] Works correctly with small decks (< 10 cards)
- [ ] Session feels unpredictable and natural
