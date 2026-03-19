# Smart Card Ordering

## Summary

Обычная due-review сессия больше не показывает карточки просто в порядке `due_at`. Перед стартом очередь проходит через smart ordering, который:

- поднимает relearning и learning выше mature review;
- ограничивает количество new cards;
- разделяет sibling cards одной ноты;
- перемешивает порядок внутри tier.

Manual review и extra study intentionally не используют этот reorder path.

## Files

- `src/lib/card-ordering.ts`
- `src/lib/review-card-selection.ts`
- `src/lib/review-card-selection.test.ts`
- `src/app/decks/[id]/review/page.tsx`
- `src/app/review/[deckId]/page.tsx`

## Ordering Rules

`orderCards(...)` строит queue в четыре шага:

1. `relearning`
2. `learning`
3. `new` (с лимитом)
4. `review`

Внутри каждого tier применяется Fisher-Yates shuffle.

## New Card Limit

Для обычной due-review сессии new cards режутся до `NEW_CARD_LIMIT = 20`.

Это ограничение не должно влиять на:

- manual review по filtered subset;
- extra study sessions.

Поэтому route pages используют `selectReviewSessionCards(...)`, который применяет reorder только к normal due queue.

## Sibling Separation

После tier ordering очередь проходит через `separateSiblings(...)`.

Цель:

- recognition и production cards одной `note_id` не должны идти слишком близко.

Текущее правило:

- minimum gap = 5 позиций.

Если deck маленький, включается small-deck fallback:

- recognition cards first;
- затем non-standard card types, если они есть;
- затем production cards.

Это лучше, чем идеальный gap, который невозможно выдержать на маленькой выборке.

## Session Routing

Обе review entry points используют один и тот же ordering helper:

- `/app/decks/[id]/review/page.tsx`
- `/app/review/[deckId]/page.tsx`

Они:

- загружают raw cards;
- вызывают `selectReviewSessionCards(...)`;
- передают готовую queue в `ReviewSession`.

За счёт этого product behavior остаётся согласованным между старыми и новыми review routes.

## Why Manual and Extra Modes Bypass Ordering

### Manual mode

Manual review должен тренировать именно тот subset, который пользователь выбрал фильтрами на deck page.

Если прогнать его через due-review ordering:

- часть `new` cards может исчезнуть из-за лимита;
- пользователь потеряет точное соответствие между deck filters и study set.

### Extra mode

Extra study already uses its own selection logic:

- сначала new cards;
- затем ближайшие upcoming cards.

Дополнительный reorder поверх этого ослабил бы ожидаемую логику режима.
