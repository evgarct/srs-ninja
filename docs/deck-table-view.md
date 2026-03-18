# Deck Table View

## Summary

Страница колоды переведена из карточечного списка в full-width таблицу. Экран теперь ориентирован на быстрый обзор нотов, локальные действия и ручную тренировку только по текущему отфильтрованному набору.

## Files

- `src/app/deck/[id]/page.tsx`
- `src/components/deck-page-client.tsx`
- `src/components/deck-filters-bar.tsx`
- `src/components/deck-status-badge.tsx`
- `src/components/deck-card-preview-dialog.tsx`
- `src/components/delete-note-button.tsx`
- `src/components/generate-audio-button.tsx`
- `src/app/review/[deckId]/page.tsx`
- `src/lib/actions/cards.ts`
- `src/lib/deck-notes.ts`
- `src/lib/flashcard-mapping.ts`

## Data Model

Таблица опирается на ноту как на основную строку UI, а не на отдельную карточку.

Для каждой ноты вычисляются:

- `audioUrl`
- `word`
- агрегированное FSRS-состояние ноты
- эвристический процент закрепления слова

## Aggregate FSRS State

Агрегированное состояние вычисляется по приоритету:

1. `relearning`
2. `learning`
3. `new`
4. `review`

Это intentionally pessimistic aggregation: если хотя бы одна карточка ноты ещё не дошла до `review`, строка не выглядит как полностью выученная.

## Memory Percentage

Если у карточек есть FSRS-данные (`state`, `stability`), рядом с цветным чипом показывается процентная оценка того, насколько слово уже закрепилось.

Это не точная вероятность из FSRS-модели, а UI-эвристика для быстрого сканирования таблицы:

- состояние даёт базовый уровень уверенности;
- `stability` добавляет вес;
- итог округляется до одного числа в процентах.

## Filters

Есть два клиентских фильтра в одной строке:

- `tags` — dropdown multi-select по реально существующим тегам колоды;
- `state` — dropdown multi-select по агрегированным FSRS-состояниям ноты.

Tag filter использует встроенный поиск и кнопку быстрого сброса. Search input специально останавливает menu-level event propagation, иначе Base UI menu перехватывает фокус и клавиатуру.

Те же параметры сериализуются в URL и используются повторно для ручной тренировки.

Для English deck display label тега очищается от технического префикса `ENGLISH::`.

## Manual Review

Кнопка `Train shown cards` открывает review route в `mode=manual`.

Manual mode:

- берёт текущие URL-фильтры колоды;
- на сервере заново вычисляет подходящие ноты;
- загружает все карточки этих нотов;
- запускает review-session на выбранном подмножестве, даже если часть карточек ещё не due;
- не пропускает выбранные `new`-карточки через due-review ordering c лимитом `NEW_CARD_LIMIT`, поэтому ручная тренировка сохраняет полный размер показанного набора.

Это позволяет повторять отдельную тему, тег или сегмент знаний без ручного выбора карточек по одной.

## Preview Actions

В строке таблицы есть одна preview-кнопка. Она открывает dialog, внутри которого:

- используется настоящий `Flashcard`;
- по умолчанию показывается лицевая сторона;
- есть отдельная кнопка переключения `Показать лицо / Показать оборот`;
- при наличии аудио доступен Play.

Preview не заменяет review-session и не пишет review history.

`mapFieldsToFlashcard()` вынесен в shared helper, чтобы preview-dialog и review-session использовали один и тот же mapping note fields -> flashcard props.

## Audio Generation

`GenerateAudioButton` теперь считает только текущий filtered subset:

- deck page передаёт в кнопку `visibleNoteIds`;
- `/api/tts/batch` принимает optional `noteIds`;
- batch generation обрабатывает только эти ноты;
- локальный `audioMap` обновляется сразу после ответа, поэтому Play-кнопки появляются без reload.

Кнопка также показывает счётчик и tooltip по текущему отфильтрованному набору и остаётся видимой в disabled-состоянии, если для генерации ничего не осталось.

## Storybook

Новый UI разбит на атомарные stories:

- `src/components/deck-status-badge.stories.tsx`
- `src/components/deck-filters-bar.stories.tsx`
- `src/components/deck-card-preview-dialog.stories.tsx`
- `src/components/generate-audio-button.stories.tsx`
