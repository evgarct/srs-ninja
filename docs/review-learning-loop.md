# Review Learning Loop

## Summary

Review-session больше не считает карточку “закрытой” после любого ответа. Теперь `Again` и `Hard` возвращают её обратно в текущую очередь, а `Good` / `Easy` выпускают из активной session loop.

Дополнительно dashboard перестаёт агрессивно предлагать extra study в тот же день, если пользователь уже занимался.

## Files

- `src/components/review-session.tsx`
- `src/components/extra-study-box.tsx`
- `src/components/extra-study-box.stories.tsx`
- `src/lib/review-loop.ts`
- `src/lib/review-loop.test.ts`
- `src/lib/extra-study.ts`
- `src/lib/extra-study.test.ts`

## Queue Model

`ReviewSession` теперь держит queue как список оставшихся карточек, где текущая карточка всегда `queue[0]`.

После ответа:

- текущая карточка удаляется из головы очереди;
- helper `applyReviewQueueOutcome()` решает, нужно ли вставить её обратно;
- `Again` вставляет карточку ближе к началу;
- `Hard` вставляет её немного позже;
- `Good` / `Easy` не возвращают её в очередь.

Это Anki-inspired approximation. Мы не эмулируем minute-based learning steps 1:1, но сохраняем главное UX-ожидание: трудная карточка не исчезает из текущей учебной сессии.

## Session Completion

Done-screen появляется только когда queue реально опустела. Поэтому пользователь не может “закончить” session, пока `Again/Hard` карточки ещё продолжают learning loop.

## Same-Day Extra Study

`ExtraStudyBox` теперь знает, занимался ли пользователь сегодня:

- если нет, UI может спокойно предлагать extra study;
- если да, box становится нейтральным и сворачивает `+10 / +20` за отдельную кнопку `Дополнительно`.

Это сохраняет добровольный extra mode, но убирает ощущение, что приложение сразу снова требует учиться.
