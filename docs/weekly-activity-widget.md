# Weekly Activity Widget

## Summary

`Weekly Activity Widget` отображается на Home Screen и показывает активность за последние 7 дней, текущий `streak` и количество закреплённых слов по дням.

Компонент построен как компактный light-mode блок в стиле streak-card:
- верхняя строка: `🔥 X day streak!`
- нижний блок: 7 дневных чипов (`Mon ... Sun`)

## Files

- `src/app/page.tsx`
- `src/lib/actions/stats.ts`
- `src/components/activity/WeeklyActivity.tsx`
- `src/components/activity/ActivityDay.tsx`
- `src/components/activity/index.ts`
- `src/components/ui/tooltip.tsx`

## Data Flow

1. Home page получает timezone из request header `x-vercel-ip-timezone` (fallback: `UTC`).
2. `getWeeklyActivityStats(timeZone)` запрашивает `reviews` и строит 7-дневный срез.
3. На UI передаются `days[]` и `streak`.

## Activity Logic

- День считается активным, если за него есть `>= 1 review`.
- `streak` считается как число последовательных активных дней, идущих назад от текущего дня.

## Mastered Words Metric

Для каждого дня дополнительно считается `masteredWords`:
- берутся уникальные `card_id` за день,
- учитываются только записи, где `rating >= 3` и `state = 'review'`.

Это используется как практичный индикатор «закрепилось после тренировки».

## UI Behavior

- Чип содержит круглый индикатор дня.
- Активный день: зелёный чип.
- Неактивный день: нейтральный чип с серым эмодзи `😶`.
- Если `masteredWords > 0`, внутри чипа показывается число.
- Если `masteredWords = 0`, число не отображается.
- Текущий день имеет тёмно-зелёную обводку.

## Tooltip

Для каждого дневного чипа используется tooltip (`src/components/ui/tooltip.tsx`).

Показывает:
- сколько слов закрепилось,
- что эти слова в стадии `review`,
- сколько всего повторений было в этот день.
