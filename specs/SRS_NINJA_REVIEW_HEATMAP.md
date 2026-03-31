# Echo - Feature: Review Heatmap

## Goal

Сохранить `Review Heatmap` как long-range activity surface на `/stats`, но привести его к новому dark app shell.

## Product Rules

### 1. Placement

`Review Heatmap` принадлежит странице `/stats` и рендерится внутри page-level section, а не как самостоятельная dashboard card с собственным header.

### 2. Visual contract

Heatmap должен:

- использовать dark neutral empty cells;
- использовать violet-to-lime intensity scale;
- скрывать weekday labels;
- скрывать legend;
- оставаться centered inside section.

### 3. Time window

- mobile: около 4 месяцев;
- desktop: около 9 месяцев;
- недели Monday-first;
- первый неполный месяц не должен рендериться как отдельный label.

## Acceptance Criteria

- [ ] `/stats` показывает heatmap в dark shell.
- [ ] intensity scale совместима с lime/violet accent system.
- [ ] mobile и desktop используют разные окна истории.
- [ ] tooltip продолжает показывать дату, reviews и `masteredWords`.
- [ ] компонент не вызывает layout shift после mount.
