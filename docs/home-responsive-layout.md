# Responsive-First Home Layout

## Summary

Home теперь использует dark mobile-first shell с тем же visual language, что и обновленная `/stats`:

- темный фон и glass/neon panels задаются на уровне app shell;
- верхняя навигация стала компактной pill-панелью;
- на mobile добавлена фиксированная bottom navigation с быстрым доступом к `Колоды`, `Статистика` и созданию колоды;
- home открывается hero-блоком со статусом дня и короткими KPI;
- deck list остается главным рабочим потоком, а не побочным блоком после analytics dashboard.

## Files

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/nav.tsx`
- `src/app/page.tsx`
- `src/components/home-deck-card.tsx`
- `src/components/extra-study-box.tsx`
- `src/components/home-deck-card.stories.tsx`

## Shell Contract

Общий shell использует:

1. compact floating top navigation;
2. mobile bottom navigation вне review-маршрутов;
3. единый контейнер `app-shell`;
4. reusable surface classes `app-panel`, `app-panel-muted`, `app-pill`.

Desktop остается расширенной версией mobile layout. Разница только в воздухе, размерах и плотности, а не в отдельной IA.

## Home Hierarchy

Home теперь состоит из:

1. hero/status блока;
2. списка колод.

Hero собирает:

- брендовый tag;
- краткий заголовок про текущую study session;
- агрегаты `due`, `done`, `drafts`.

Это заменяет нейтральный dashboard-grid на более app-like first screen с одним визуальным центром.

## Deck Card Pattern

`HomeDeckCard` теперь:

- использует dark glass panel с мягким accent glow по языку колоды;
- показывает крупный `due` counter отдельным status capsule;
- держит короткий explanatory line вместо dashboard copy;
- сохраняет один primary CTA и один secondary CTA;
- использует compact chips для состояний `Done today`, `N to study`, `Ready to start`, `Drafts`.

`ExtraStudyBox` остался тем же по поведению, но приведен к тому же button language.
