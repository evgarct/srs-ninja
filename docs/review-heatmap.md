# Review Heatmap

## Summary

`Review Heatmap` отображается на странице статистики и показывает review activity пользователя на более длинном historical window, чем домашний streak widget.

Это не chart library и не внешний виджет. Компонент реализован локально как shadcn-style primitive, чтобы он оставался визуально совместимым с текущей design system.

## Files

- `src/app/stats/page.tsx`
- `src/components/activity/ReviewHeatmap.tsx`
- `src/components/activity/ReviewHeatmap.stories.tsx`
- `src/components/ui/calendar-heatmap.tsx`
- `src/lib/activity.ts`

## Data Flow

1. `/stats` читает timezone пользователя из `x-vercel-ip-timezone` с fallback в `UTC`.
2. `getReviewStats(280)` загружает raw review history.
3. `buildReviewHeatmapWeeks(reviews, timeZone, { weeks: 39 })` агрегирует данные в Monday-first weekly grid.
4. `ReviewHeatmap` выбирает:
   - desktop window: 9 месяцев;
   - mobile window: 4 месяца.
5. `HeatmapCalendar` рендерит grid, month labels и tooltips.

## Heatmap Behavior

- week starts on Monday;
- первый неполный месяц в окне не рендерится;
- дни будущего внутри текущей недели не попадают в activity data;
- intensity зависит от числа `reviews` за день;
- heatmap центрируется внутри карточки;
- mobile и desktop используют разные history windows, но один и тот же visual language.

## Visual Rules

- блок использует стандартный `Card` container;
- заголовок секции вынесен на уровень страницы, как у остальных stats blocks;
- weekday labels скрыты;
- legend скрыт;
- cells intentionally крупные и scan-friendly;
- tooltips показывают дату, число review и `masteredWords`.

## Layout Stability

Чтобы избежать прыжка layout при загрузке:

- `ReviewHeatmap` не измеряет контейнер после mount;
- mobile и desktop переключаются только через CSS breakpoints;
- размер клеток фиксирован внутри выбранного варианта.
