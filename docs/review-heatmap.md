# Review Heatmap

## Summary

`ReviewHeatmap` остался статистическим historical surface, но получил новый dark visual contract:

- блок рендерится внутри page-owned panel, а не внутри собственного `Card`;
- intensity palette смещена в violet-to-lime диапазон;
- подписи и grid подстроены под dark shell;
- mobile и desktop по-прежнему используют разные окна истории.

## Files

- `src/app/stats/page.tsx`
- `src/components/activity/ReviewHeatmap.tsx`
- `src/components/activity/ReviewHeatmap.stories.tsx`
- `src/components/ui/calendar-heatmap.tsx`
- `src/lib/activity.ts`

## Data Flow

1. `/stats` вычисляет timezone пользователя.
2. `getReviewStats(280)` читает сырые reviews.
3. `buildReviewHeatmapWeeks(..., { weeks: 39 })` агрегирует данные в Monday-first weeks.
4. `ReviewHeatmap` передает агрегаты в `HeatmapCalendar`.

## Visual Contract

- mobile показывает около 4 месяцев;
- desktop показывает около 9 месяцев;
- weekday labels скрыты;
- legend скрыт;
- пустые клетки читаются как muted dark cells;
- высокие уровни активности уходят в lime accent;
- tooltip по-прежнему показывает дату, число review и `masteredWords`.

## Layout Stability

Компонент не измеряет контейнер после mount. Переключение mobile/desktop происходит только через CSS breakpoints, поэтому heatmap не должен дергать layout во время загрузки.
