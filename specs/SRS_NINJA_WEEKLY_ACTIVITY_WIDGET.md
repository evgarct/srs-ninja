# Echo - Feature: Weekly Activity Widget

## Goal

Использовать `WeeklyActivity` как streak section внутри `/stats`, а не как обязательный блок Home.

## Product Rules

### 1. Placement

Виджет должен жить внутри `/stats` и сопровождать streak summary.

### 2. Structure

Блок состоит из:

- текущего `streak`;
- `week complete` percent;
- progress bar;
- 7 day cells.

### 3. Day states

- active day: lime state;
- inactive past day: muted dark state;
- future day: disabled dark state;
- today: additional glow outline.

### 4. Symbols

Day cell показывает:

- `✓`, если были `masteredWords`;
- `•`, если были reviews без закрепления;
- `×`, если активности не было;
- `·`, если день еще в будущем.

## Acceptance Criteria

- [ ] `/stats` показывает WeeklyActivity рядом со streak summary.
- [ ] Виджет использует те же данные `days[]` и `streak`.
- [ ] Day states визуально соответствуют dark shell.
- [ ] Home больше не зависит от этого блока как от первого motivator surface.
