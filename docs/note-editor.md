# Note Editor

## Summary

Note editor позволяет редактировать поля ноты в двух контекстах:

- на странице колоды;
- прямо во время review session.

Редактирование не должно ломать текущий study flow: после save UI сразу обновляет текущую ноту и все карточки в очереди с тем же `note_id`, а для поддерживаемых TTS-языков при необходимости может сразу перегенерировать аудио.

## Files

- `src/components/note-edit-sheet.tsx`
- `src/components/note-editor-form.tsx`
- `src/lib/actions/notes.ts`
- `src/lib/note-fields.ts`
- `src/lib/note-audio.ts`
- `src/components/review-session.tsx`
- `src/app/deck/[id]/page.tsx`

## Entry Points

### Deck page

На deck page editor открывается как sheet/dialog поверх списка нотов.

После save:

- строка ноты обновляется локально;
- новый `audioUrl`, если он есть, сразу попадает в row state;
- table view и фильтры не требуют полной перезагрузки страницы.

### Review session

Во время review session editor открывается через `headerAction` внутри `Flashcard`.

После save:

- текущая карточка остаётся в сессии;
- её `notes.fields` обновляются в queue state;
- sibling cards с тем же `note_id` тоже получают новые fields;
- при регенерации аудио локальный `dynamicAudio` map обновляется сразу.

## UI Structure

`NoteEditSheet` отвечает за:

- открытие и закрытие sheet;
- прокидывание initial fields и current audio;
- единый `onSaveSuccess` callback наружу.

`NoteEditorForm` отвечает за:

- field rendering по language-aware schema;
- browser validation;
- обычный save;
- save with forced audio regeneration;
- immediate audio preview playback при успешной регенерации.

## Shared Field Contract

Форма не работает с raw field keys напрямую. Вместо этого используются shared helpers:

- `getFields(language)`
- `getNoteFormValues(language, initialFields)`
- `normalizeNoteFields(values, language)`
- `getNotePrimaryText(fields)`

Это держит form model синхронной с canonical note schema и не позволяет разным UI писать несовместимые payloads.

## Save Flow

`updateNoteFields(...)`:

- нормализует fields;
- обновляет `notes.fields`;
- заново читает status ноты;
- решает, нужен ли TTS;
- при необходимости вызывает `generateAndCacheAudio(...)`;
- revalidate-ит deck и drafts pages;
- возвращает `{ success, audioUrl }`.

Клиентский editor использует этот ответ как основной источник истины для мгновенного UI-обновления.

## Audio Regeneration

Для поддерживаемых TTS-языков editor показывает отдельный путь:

- `Save Changes`
- `Save & Regenerate Audio`

Forced path проходит ту же browser validation через `form.reportValidity()`, поэтому нельзя сохранить пустые required fields только потому, что пользователь выбрал regenerate flow.

Если сервер вернул новый `audioUrl`, форма:

- обновляет local preview state;
- показывает success toast;
- пытается сразу проиграть свежий mp3.

## Why This Matters for Review

Review session не должна показывать устаревшие sibling cards после edit.

Поэтому `handleSaveSuccess(...)` в `ReviewSession` обновляет queue по `note_id`, а не только текущую карточку. Это сохраняет консистентность recognition/production pair внутри активной сессии.
