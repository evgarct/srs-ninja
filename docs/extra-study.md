# Extra Study

Фича позволяет пользователю запустить дополнительную сессию повторения, когда на сегодня нет плановых карточек, — или когда он хочет изучить больше.

---

## Кейсы использования

| Кейс | Поведение |
|------|-----------|
| Все плановые карточки повторены (`due = 0`) | На дашборде вместо кнопки «Учить» появляется `ExtraStudyBox` с кнопками **+10** и **+20** |
| Есть плановые карточки (`due > 0`) | Стандартный режим, `ExtraStudyBox` не отображается |
| В колоде нет ни новых, ни будущих карточек | Страница ревью показывает пустой экран «Нет новых слов» |

---

## Алгоритм выборки карточек — `getExtraStudyCards`

**Файл:** [`src/lib/actions/cards.ts`](../src/lib/actions/cards.ts)

Адаптивная двухуровневая стратегия (не более `limit = 20` карточек):

```
1. Новые карточки (state = 'new')
   └─ сортировка: created_at ASC (самые старые первыми)
   └─ limit: до limit штук

2. Если новых < limit → добираем из будущих (due_at > now, state ≠ 'new')
   └─ сортировка: due_at ASC (те, что наступят скорее)
   └─ limit: limit - (кол-во новых)
```

```typescript
// Псевдо-flow
const newCards = await query({ state: 'new', order: 'created_at ASC', limit })
if (newCards.length >= limit) return newCards

const remaining = limit - newCards.length
const upcoming  = await query({ state: '≠ new', due_at: '> now', order: 'due_at ASC', limit: remaining })
return [...newCards, ...upcoming]
```

### Почему два запроса, а не один?

Supabase query builder не поддерживает `UNION` напрямую. Два последовательных запроса проще и гарантируют правильный порядок: сначала всегда идут новые карточки.

---

## Как FSRS обрабатывает досрочное повторение

**Файл:** [`src/lib/fsrs.ts`](../src/lib/fsrs.ts), [`src/lib/actions/cards.ts → submitReview`](../src/lib/actions/cards.ts)

Когда карточка из «будущих» повторяется раньше срока (`now < due_at`), **никакой специальной логики не нужно**. ts-fsrs считает `elapsed_days` автоматически:

```
elapsed_days = dateDiffInDays(last_review, now)
```

Если карточка повторена досрочно — `elapsed_days < scheduled_days`. Алгоритм FSRS-6 учитывает это при расчёте нового `stability` и следующего интервала. `submitReview` вызывается одинаково для любого типа карточки.

---

## URL-параметры для режима Extra Study

Маршрут: `/review/[deckId]?mode=extra&limit=N`

| Параметр | Значение | По умолчанию |
|----------|----------|-------------|
| `mode`   | `extra` — вызвать `getExtraStudyCards` вместо `getDueCards` | — (обычный режим) |
| `limit`  | Число карточек для сессии | `10` |

Диапазон `limit` ограничен: `Math.min(Math.max(parseInt(limit), 1), 50)`.

---

## Задействованные файлы

| Файл | Роль |
|------|------|
| [`src/lib/actions/cards.ts`](../src/lib/actions/cards.ts) | `getExtraStudyCards` — выборка карточек |
| [`src/components/extra-study-box.tsx`](../src/components/extra-study-box.tsx) | UI-компонент с кнопками +10 / +20 |
| [`src/app/page.tsx`](../src/app/page.tsx) | Дашборд — условный рендер `ExtraStudyBox` |
| [`src/app/review/[deckId]/page.tsx`](../src/app/review/%5BdeckId%5D/page.tsx) | Страница ревью — разбор `searchParams`, выбор fetcher'а |
| [`src/lib/fsrs.ts`](../src/lib/fsrs.ts) | `scheduleCard` — FSRS расчёт (без изменений) |
