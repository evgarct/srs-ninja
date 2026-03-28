# Czech Note Schema

## Summary

Чешская колода теперь использует такой же канонический подход, как английская, но сама учебная модель остаётся русскоязычной:

- `word` хранит чешское слово или фразу;
- `translation` хранит прямой русский перевод;
- грамматические и стилистические поля тоже выражаются через русские значения, а не через английский промежуточный слой.

## Stored Keys

Канонические ключи внутри `notes.fields`:

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

Вне `fields`:

- `notes.tags`
- аудио в `audio_cache`

## Editor Contract

Форма создания и редактирования Czech notes использует этот же список полей.

Особенности:

- `synonyms` и `antonyms` редактируются как текст и сохраняются как `string[]`;
- `examples_html` редактируется как HTML-список;
- `gender` заполняется только для существительных;
- `verb_class` и `verb_irregular` заполняются только для глаголов.

## Review Mapping

Review и preview берут Czech данные так:

- headline: `word`
- translation: `translation`
- examples: `examples_html`
- metadata: `level`, `part_of_speech`, `popularity`, `style`, `gender`, `verb_class`
- note surface: объединение `verb_class`, `verb_irregular`, `note`

Это позволяет показывать чешскую грамматику на карточке без старых отдельных полей вроде `example_sentence`.

## Removed Legacy Keys

Новый Czech contract больше не использует:

- `expression`
- `term`
- `pronunciation`
- `example_sentence`
- `example_translation`
- `image_url`
- `notes`
- `frequency`

Если такие ключи приходят в draft import, они считаются неизвестными и не попадают в сохранённый payload.

## Audio

Озвучка продолжает работать от primary text:

- для Czech primary text берётся из `word`;
- аудио генерируется отдельно и не дублируется в JSON полях ноты.
