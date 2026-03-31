# Echo - Feature: Responsive-First Home Layout

## Goal

Сделать Home более похожим на mobile-native productivity surface:

- темный визуальный язык по умолчанию;
- компактный shell;
- быстрый доступ к основным разделам;
- deck list как основной рабочий поток.

## Product Rules

### 1. Unified dark shell

Главный shell должен использовать один и тот же dark theme contract на Home и Stats:

- dark background;
- glass panels;
- lime/violet accents;
- compact top navigation.

### 2. Mobile navigation

На mobile вне review-маршрутов должна существовать фиксированная bottom navigation:

- `Колоды`
- `Статистика`
- быстрое создание колоды

### 3. Home hierarchy

Home должен начинаться с hero/status surface, после которого сразу идет список колод.

На Home допустимы:

- brand tag;
- короткий status headline;
- небольшие агрегаты дня.

Недопустим отдельный тяжелый analytics dashboard перед списком колод.

### 4. Deck cards

Каждая deck card обязана иметь:

- крупный status surface с `due`;
- один dominant study CTA;
- один secondary CTA для перехода в deck;
- compact chips для состояния сессии.

### 5. Desktop behavior

Desktop не должен вводить отдельный sidebar или иную IA. Он остается расширенной версией mobile shell.

## Acceptance Criteria

- [ ] Home и Stats используют общий dark visual language.
- [ ] На mobile есть fixed bottom navigation вне review screen.
- [ ] Home начинается с hero/status блока.
- [ ] Deck list остается первым главным actionable блоком после hero.
- [ ] Каждая deck card имеет один primary и один secondary CTA.
- [ ] Secondary actions не конкурируют с основным review flow.
