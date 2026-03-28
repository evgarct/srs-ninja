# SRS Ninja — Czech Note Schema Alignment

## Goal

Привести чешскую колоду к тому же каноническому подходу, что и английскую, но без английской прослойки в содержимом карточек.

Основной учебный сценарий:

- слово или фраза на чешском;
- прямой перевод на русский;
- вся сопутствующая грамматика и метаинформация тоже описываются в русскоязычном контракте.

## Canonical Czech Contract

Контент чешской ноты в `notes.fields` должен использовать только эти ключи:

- `word`
- `translation`
- `level`
- `part_of_speech`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`
- `gender`
- `verb_class`
- `verb_irregular`
- `note`

Теги остаются вне `fields`:

- `notes.tags`

Аудио остаётся отдельным note-adjacent слоем:

- текст для TTS берётся из primary text;
- ссылка и кэш хранятся в `audio_cache`, а не в `notes.fields`.

## Field Semantics

### Required

- `word`
- `translation`

### Controlled Optional Fields

- `level`
  - `A2`
  - `B1`
  - `B2`
  - `C1`
  - `C2`
- `part_of_speech`
  - `существительное`
  - `глагол`
  - `прилагательное`
  - `наречие`
  - `местоимение`
  - `предлог`
  - `союз`
  - `частица`
  - `междометие`
  - `числительное`
  - `фраза`
  - `идиома`
- `style`
  - `нейтральный`
  - `разговорный`
  - `формальный`
  - `книжный`
  - `просторечный`
  - `жаргонный`
  - `технический`
- `popularity`
  - integer `1..10`
- `gender`
  - `мужской одушевлённый`
  - `мужской неодушевлённый`
  - `женский`
  - `средний`
- `verb_class`
  - `-at`
  - `-it/-et/-ět`
  - `-ovat`
  - `неправильный`

### Rich / Text Fields

- `synonyms`
  - stored as `string[]`
- `antonyms`
  - stored as `string[]`
- `examples_html`
  - stored as `<ul><li>…</li><li>…</li></ul>`
  - expected to contain 2 examples
  - studied word should usually be wrapped in `<b>`
- `verb_irregular`
  - short text for irregular forms or conjugation exceptions
- `note`
  - free-form teacher note

## Read And Write Rules

- Все create/edit/import пути для Czech должны сохранять только канонические ключи.
- Новые или отредактированные Czech notes не должны записывать legacy keys:
  - `expression`
  - `term`
  - `pronunciation`
  - `example_sentence`
  - `example_translation`
  - `image_url`
  - `notes`
  - `frequency`
- Review UI, draft preview и flashcard mapping должны читать Czech examples из `examples_html`, а не из старых pair-полей.
- Спряжение и глагольные исключения должны быть видимы на review surface через `verb_class` и `verb_irregular`.

## Legacy Compatibility

Канонический Czech contract остаётся обязательным для сохранения, но read/import normalization должен терпеть минимальный набор legacy alias-ключей, чтобы исторические notes и старые import payload'ы не ломались после schema alignment.

Разрешённые alias fallback'и:

- `expression` или `term` -> `word`
- `notes` -> `note`
- `frequency` -> `popularity`

Ограничения:

- после нормализации и любого нового сохранения должны оставаться только канонические ключи;
- compatibility не должна возвращать старые pair-поля вроде `example_sentence` или `example_translation` обратно в продуктовый контракт;
- legacy fallback нужен только как защитный слой для чтения и импорта, а не как разрешение продолжать писать старую схему.

## Acceptance Criteria

- [ ] Чехский редактор использует новый канонический набор полей.
- [ ] Czech draft contract возвращает только новый набор полей.
- [ ] Czech draft validation сохраняет только канонические ключи.
- [ ] Czech normalization понимает `expression` / `term`, `notes`, и `frequency` как legacy fallback'и, но записывает обратно только канонические ключи.
- [ ] Review flashcard читает чешские примеры из `examples_html`.
- [ ] Czech synonyms / antonyms / note / verb metadata отображаются без старых pair-полей.
- [ ] TTS продолжает работать от primary Czech text без дублирования аудио в `fields`.
