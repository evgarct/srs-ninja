# Echo --- Feature: Review Heatmap

## Context

На странице статистики нужен более репрезентативный индикатор review activity, чем простой список квадратов за последние 30 дней.

Компонент должен помогать быстро считывать:

- ритм повторений во времени;
- периоды высокой и низкой активности;
- текущую неделю в контексте более длинной истории.

------------------------------------------------------------------------

## What to Build

### 1. Review Heatmap on Stats

На `/stats` должен появиться `Review Heatmap`, который показывает history of review activity в виде Monday-first heatmap grid.

### 2. Product Intent

`Review Heatmap` не должен заменять Home streak widget.

Роли разделены так:

- Home = короткий motivator / recent streak
- Stats = historical activity surface

### 3. Visual Layout

Блок должен:

- использовать стандартный `Card` container;
- иметь секционный заголовок на уровне страницы, а не внутри самой карточки;
- центрировать heatmap внутри карточки;
- скрывать weekday labels;
- скрывать legend;
- показывать month labels только для полных месяцев;
- использовать достаточно крупные day cells для комфортного desktop scan.

### 4. Window Rules

- desktop показывает примерно 9 месяцев истории;
- mobile показывает примерно 4 месяца истории;
- первый неполный месяц в окне не должен рендериться;
- неделя начинается с понедельника.

------------------------------------------------------------------------

## Data Model

Источником остается таблица `reviews`.

Для heatmap нужны агрегаты по локальным дням пользователя:

```sql
SELECT reviewed_at, rating, state
FROM reviews
WHERE user_id = '{user_id}'
  AND reviewed_at >= now() - interval '280 days'
ORDER BY reviewed_at ASC;
```

Примечания:

- агрегирование выполняется в приложении, а не в SQL;
- timezone пользователя обязателен;
- будущие даты не должны появляться как активные.

------------------------------------------------------------------------

## UI Components

`src/components/activity/`
- `ReviewHeatmap.tsx`
- `ReviewHeatmap.stories.tsx`

`src/components/ui/`
- `calendar-heatmap.tsx`

`src/lib/`
- `activity.ts`

------------------------------------------------------------------------

## Behavior

- 0 reviews = empty cell;
- higher review counts = stronger intensity bucket;
- tooltip по cell показывает:
  - дату,
  - число review,
  - `masteredWords`;
- heatmap не должен вызывать заметный layout shift при загрузке страницы;
- mobile и desktop должны переключаться по breakpoint, а не через post-mount resize recalculation.

------------------------------------------------------------------------

## Acceptance Criteria

- [ ] `/stats` показывает `Review Heatmap`
- [ ] heatmap использует Monday-first reading
- [ ] первый неполный месяц в диапазоне не рендерится
- [ ] desktop и mobile используют разные history windows
- [ ] weekday labels скрыты
- [ ] legend скрыт
- [ ] day cells остаются крупными и читаемыми
- [ ] блок не дергает layout при initial load
- [ ] компонент остается визуально совместимым с текущей dashboard design system
