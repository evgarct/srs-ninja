# Weekly Activity Widget

## Summary

`WeeklyActivity` больше не является home-only motivator. В текущем shell он используется на `/stats` как часть streak section:

- сверху показываются `streak` и `week complete`;
- ниже идет progress bar;
- затем 7 day cells в том же dark neon language.

## Files

- `src/app/stats/page.tsx`
- `src/lib/actions/stats.ts`
- `src/components/activity/WeeklyActivity.tsx`
- `src/components/activity/WeeklyActivity.stories.tsx`

## Behavior

- активный день: bright lime state;
- пустой день: muted dark state;
- будущий день: еще более слабый disabled state;
- текущий день получает glow outline;
- ячейка показывает `✓`, если есть `masteredWords`, `•`, если были reviews без закрепления, `×`, если активности не было.

## Product Intent

Этот блок теперь работает как streak goal section внутри `Статистика`, а не как обязательный первый экран Home. Home остается focused на выборе колоды и входе в review flow.
