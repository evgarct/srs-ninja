# Echo - Feature: Responsive-First Home Layout

## Context

Главная страница со временем стала выглядеть как компактный dashboard:

- верхняя навигация на мобильном читалась как сжатая desktop-строка;
- summary и streak забирали слишком много внимания до того, как пользователь видел deck list;
- deck cards смешивали статус, primary CTA и secondary navigation без достаточно ясной иерархии;
- desktop и mobile начинали расходиться по ощущению, хотя продукту нужен один и тот же home surface.

Для Home это ослабляет главный сценарий: пользователь должен сразу понимать, что делать дальше, а не разбирать конкурирующие блоки.

## Goal

Сделать Home единым responsive-first экраном, где mobile layout является базовым шаблоном для всех размеров, а desktop выглядит как та же самая страница с более свободным контейнером и spacing.

## Product Rules

### 1. One shared layout

Home должен использовать один и тот же порядок секций на mobile и desktop:

1. top navigation
2. page header
3. deck list

Desktop не должен получать:

- отдельный sidebar;
- отдельную dashboard-композицию;
- новую IA;
- другой navigation pattern.

### 2. Mobile-first shell

Навигация на mobile должна быть компактной и не конкурировать с контентом.

- Частые разделы могут оставаться видимыми.
- Вторичные действия должны уходить в overflow menu.
- `Выйти` не должен оставаться primary action в верхней строке.

### 3. Deck list as main focus

Deck list должен оставаться главным actionable контентом Home.

- analytics summary не должен занимать отдельный крупный блок на первом экране;
- weekly streak может быть временно скрыт, если для него еще не выбран финальный visual pattern;
- пользователь должен быстро увидеть хотя бы одну полноценную deck card;
- deck cards должны использовать единый шаблон состояний.

### 4. Deck action hierarchy

Каждая deck card должна иметь:

- один явно доминирующий primary CTA для study flow;
- один полноценный secondary CTA для перехода в deck;
- compact status chips вместо body copy.

Нельзя делать `Continue learning` и `Open deck` одинаково тяжелыми по визуальному весу.

Home не должен показывать raw red due-pressure, если он не соответствует пользовательскому ощущению после completed session и не меняет следующий шаг внутри review flow.

Допустимый status vocabulary:

- `Done today`
- `N to study`
- `Ready to start`
- `Drafts`

Правила:

- `Done today` и `N to study` не могут показываться вместе;
- `Done today` и `Ready to start` не могут показываться вместе;
- `Drafts` может сосуществовать с любым основным статусом;
- chip-строка должна быть на одной линии с заголовком колоды и выровнена вправо.
- если deck помечен как `Done today` и visible due work нет, primary CTA на Home открывает optional extra-study choice (`+10`, `+20`);
- если deck помечен как `Done today`, но visible due work снова появилось, Home сохраняет позитивный статус и все равно дает прямой due-review CTA;
- если deck еще не был пройден сегодня, Home не показывает extra-study choice и дает один прямой стартовый CTA.

### 5. Desktop as a larger version of mobile

На больших экранах разрешено увеличивать:

- максимальную ширину контейнера;
- отступы;
- размер типографики;
- визуальный воздух между блоками.

Нельзя перестраивать страницу в отдельный desktop-specific dashboard.

## Acceptance Criteria

- [ ] Home использует один и тот же порядок секций на mobile и desktop.
- [ ] Верхняя навигация на mobile больше не выглядит как длинная строка из desktop-пунктов.
- [ ] `Выйти` убран из основной строки навигации и доступен как secondary action.
- [ ] Deck list визуально читается как главный блок страницы.
- [ ] Streak не вытесняет deck list слишком далеко вниз.
- [ ] Home не содержит крупного daily stats блока между title и deck list.
- [ ] Каждая deck card имеет один доминирующий primary CTA и один secondary CTA той же высоты.
- [ ] Deck cards не показывают `cards total` и не содержат redundant helper text.
- [ ] Статус deck card передается через chips и не противоречит доступному CTA.
- [ ] Home не показывает raw red due-count как тревожный сигнал, если это не соответствует user-facing next step.
- [ ] Для `Done today` extra-study menu содержит только `+10` и `+20`.
- [ ] Для deck без completed-today status Home показывает прямой CTA запуска без extra-study dropdown.
- [ ] Weekly streak скрыт с Home до отдельного дизайн-решения.
- [ ] Desktop остается той же самой страницей, а не отдельной dashboard-версией.
