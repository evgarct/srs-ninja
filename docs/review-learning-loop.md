# Review Learning Loop

## Summary

Review-session больше не считает карточку “закрытой” после любого ответа. Теперь `Again` и `Hard` возвращают её обратно в текущую очередь, а `Good` / `Easy` выпускают из активной session loop.

Дополнительно dashboard перестаёт агрессивно предлагать extra study в тот же день, если пользователь уже занимался.
И ещё один UI guard: dashboard review CTA больше не поднимает карточки, которые уже были review-нуты сегодня. Они могут оставаться due в самой системе интервального повторения, но не должны снова мгновенно возвращать кнопку `Учить` на главной.

## Files

- `src/components/review-session.tsx`
- `src/components/extra-study-box.tsx`
- `src/components/extra-study-box.stories.tsx`
- `src/lib/review-loop.ts`
- `src/lib/review-loop.test.ts`

## Queue Model

`ReviewSession` теперь держит queue как список оставшихся карточек, где текущая карточка всегда `queue[0]`.

После ответа:

- текущая карточка удаляется из головы очереди;
- helper `applyReviewQueueOutcome()` решает, нужно ли вставить её обратно;
- `Again` вставляет карточку ближе к началу;
- `Hard` вставляет её немного позже;
- `Good` / `Easy` не возвращают её в очередь.

Это Anki-inspired approximation. Мы не эмулируем minute-based learning steps 1:1, но сохраняем главное UX-ожидание: трудная карточка не исчезает из текущей учебной сессии.

На уровне dashboard aggregation это дополнено app-level policy:

- виджет `Учить` использует не raw `due_at <= now`, а `visible due count`;
- `visible due count` исключает карточки, у которых уже есть хотя бы один review event за текущий локальный день пользователя;
- сами интервалы FSRS и `due_at` при этом не переписываются.

## Session Completion

Done-screen появляется только когда queue реально опустела. Поэтому пользователь не может “закончить” session, пока `Again/Hard` карточки ещё продолжают learning loop.

## Same-Day Extra Study

`ExtraStudyBox` теперь ведет себя одинаково для всех idle-состояний Home:

- extra study не стартует мгновенно по одному tap;
- пользователь сначала выбирает размер `+10` или `+20`;
- same-day состояние по-прежнему остается нейтральным и не маскируется под основной due review.

Это сохраняет добровольный extra mode и убирает скачки между прямым стартом и dropdown-выбором.
