# Review Flow and Dashboard Due Counts

## Summary

В приложении есть два review entry points, но оба ведут к одному и тому же core flow:

- сервер загружает карточки и deck context;
- клиентский `ReviewSession` ведёт queue, reveal/rate cycle и done state;
- dashboard показывает due counts по колодам и служит основной точкой входа в study.

## Files

- `src/app/page.tsx`
- `src/app/decks/[id]/review/page.tsx`
- `src/app/review/[deckId]/page.tsx`
- `src/components/review-session.tsx`
- `src/lib/actions/cards.ts`
- `src/lib/actions/decks.ts`
- `src/lib/review-session.ts`
- `src/lib/review-loop.ts`

## Dashboard Contract

Главная страница использует `getDashboardStats()` и показывает по каждой колоде:

- общее количество карточек;
- количество due cards;
- количество drafts;
- CTA в review flow, если due cards > 0.

Когда due cards нет:

- deck card ведёт в deck page;
- extra study предлагается отдельно и не маскируется под normal review.

## Review Entry Points

### `/app/decks/[id]/review/page.tsx`

Legacy/simple route для due-review:

- грузит deck;
- получает due cards;
- применяет `orderCards(...)`;
- prefetch-ит `audio_cache`;
- рендерит `ReviewSession`.

### `/app/review/[deckId]/page.tsx`

Расширенный route:

- поддерживает normal review;
- extra study (`mode=extra`);
- manual filtered study (`mode=manual`);
- выбирает reorder policy через `selectReviewSessionCards(...)`.

Этот route является более общим контрактом review flow.

## Due Card Fetching

`getDueCards(deckId, limit)`:

- выбирает только approved notes;
- фильтрует по `due_at <= now`;
- сортирует по `due_at`;
- возвращает карточки вместе с `notes.fields` и `tags`.

Это серверный baseline; product-level ordering и queue behavior применяются уже после fetch.

## Review Session Client Flow

`ReviewSession` держит session state локально:

- `queue`
- `revealed`
- `done`
- `sessionStats`
- pending sync counter

После rating:

- локально применяется `applyReviewQueueOutcome(...)`;
- UI сразу переходит дальше без ожидания network round-trip;
- `submitReview(...)` синкается в фоне;
- если sync fails, пользователь видит warning, но session не ломается.

Это intentionally optimistic UX: обучение не должно ждать Supabase после каждого ответа.

## Done State

Done-screen показывается, только когда queue реально пуста.

Экран включает:

- reviewed cards count;
- accuracy;
- pending sync state, если сохранение ещё идёт;
- CTA на повторный запуск или возврат на home.

## Audio in Review

Server route prefetch-ит `audio_cache` для текущего набора карточек.

Дальше `ReviewSession`:

- готовит flashcard props;
- прогревает audio lookahead;
- autoplay-ит audio в recognition front и production back;
- умеет локально подменять `audioUrl`, если note edit прямо в сессии регенерировал mp3.

## Why Dashboard Counts Matter

Dashboard due counts и review route должны оставаться согласованными:

- если deck card обещает `Учить (N)`, review route должен открывать именно due-review entry point;
- manual и extra study не должны искажать этот базовый due count;
- drafts считаются отдельно и не входят в review-ready inventory.
