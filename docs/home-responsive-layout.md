# Responsive-First Home Layout

## Summary

Home переведен к единому responsive-first контракту:

- mobile layout стал базовой композицией для всех размеров экрана;
- navigation стала компактнее и вынесла вторичные действия в overflow menu;
- daily summary убран с Home, чтобы первый экран не выглядел как analytics dashboard;
- weekly streak временно скрыт с Home до отдельного дизайн-решения;
- deck list переведен в один основной вертикальный поток и стал главным actionable блоком;
- desktop теперь выглядит как более просторная версия mobile home, а не как отдельный dashboard.

## Files

- `src/app/page.tsx`
- `src/components/nav.tsx`
- `src/components/home-deck-card.tsx`
- `src/components/extra-study-box.tsx`
- `src/components/activity/WeeklyActivity.tsx`
- `src/components/home-deck-card.stories.tsx`

## Layout Contract

Home использует один и тот же порядок секций на всех размерах:

1. top navigation
2. page header
3. deck list

Ключевое правило: desktop не переосмысляет экран как отдельный dashboard. Вместо этого страница остается внутри ограниченного контейнера и меняет только spacing и visual breathing room.

## Navigation

`Nav` больше не держит полную строку `Главная / Статистика / Импорт / Выйти`.

Теперь shell использует:

- два видимых частых раздела: `Главная`, `Статистика`;
- overflow menu для вторичных действий;
- `Импорт` и `Выйти` внутри dropdown.

Это снижает шум на мобильном и сохраняет прямой доступ к частым переходам без burger-first паттерна.

## Home Hierarchy

`src/app/page.tsx` теперь собирает Home как одну вертикальную ленту:

- header с названием страницы и CTA создания колоды;
- deck list в одну колонку.

Фоновый decorative `ReactBitsRibbons` убран с Home, чтобы не конкурировать с review-oriented поверхностью.

Daily stats больше не занимают первый экран: для Home важнее показать состояние колод и следующий шаг, чем обзорные метрики.
Weekly streak временно скрыт с Home и будет возвращен отдельным pass после выбора финального visual pattern.

## Deck Card Pattern

`HomeDeckCard` теперь использует более жесткую иерархию:

- row status chips в одной строке с названием колоды;
- только user-facing states, без `cards total` и без отдельного helper copy в теле карточки;
- primary CTA как доминирующий action;
- `Open deck` как полноценный secondary button с иконкой и той же высотой.

Home больше не показывает raw red due-count как основной смысл карточки. Вместо этого chip и CTA описывают следующее действие на языке пользователя: `Done today`, `N to study`, `Ready to start`.

Для idle-состояний `ExtraStudyBox` сохраняет existing extra-study behavior, но без отдельного helper text. Если deck уже завершен на сегодня и visible due work нет, extra-study menu показывает только `+10` и `+20`.
Если deck уже завершен на сегодня, но due cards снова появились, chip `Done today` остается видимым, а primary CTA возвращается к прямому due-review path вместо extra-study dropdown.
Если deck еще не был начат сегодня, Home не показывает extra-study choice. Вместо этого primary CTA сразу запускает стартовую learning session одним действием.
