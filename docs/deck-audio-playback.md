# Deck Page Audio Playback

## Summary

Фича добавляет ручное воспроизведение TTS-аудио прямо на странице колоды (`/deck/[id]`) в двух местах:

- в строке ноты внутри списка;
- в `NoteEditSheet` при редактировании.

Главный технический контракт: после генерации или регенерации TTS UI не ждёт полную перезагрузку страницы. Новый `audioUrl` сразу попадает в клиентское состояние, кнопка Play появляется мгновенно и свежесгенерированное аудио сразу запускается автоматически.

## Files

- `src/app/deck/[id]/page.tsx`
- `src/components/deck-page-client.tsx`
- `src/components/generate-audio-button.tsx`
- `src/components/note-edit-sheet.tsx`
- `src/components/note-editor-form.tsx`
- `src/lib/audio.ts`
- `src/lib/actions/notes.ts`
- `src/lib/tts.ts`
- `src/app/api/tts/batch/route.ts`

## Existing Backend Contract

Серверная логика уже умеет:

- сохранить новые `fields` ноты через `updateNoteFields(...)`;
- при изменении primary text или `forceAudio = true` вызвать `generateAndCacheAudio(...)`;
- записать новый public URL в `audio_cache`;
- вернуть `{ success, audioUrl }` обратно в клиент.

Это означает, что для мгновенного UI-обновления дополнительный polling не нужен: клиенту достаточно принять `audioUrl` из server action и локально обновить состояние ноты.

Для batch-генерации `/api/tts/batch` теперь также возвращает список `generatedAudio[]`, чтобы страница колоды могла локально обновить `audioMap` без reload.

## UI Architecture

### Deck page state

Страница колоды должна отдавать в client component:

- список нотов;
- начальный `audioMap` (`noteId -> storage_path`);
- активный audio filter (`all` / `with_audio` / `without_audio`).

Дальше client component становится источником истины для мгновенного UI:

- решает, показывать ли Play-кнопку;
- обновляет row после `onSaveSuccess`;
- моментально пересчитывает список нотов для фильтра `Without audio`.

### Edit sheet state

`NoteEditSheet` должен получать:

- текущие поля ноты;
- текущий `audioUrl`;
- callback для возврата обновлённых полей и нового `audioUrl` наружу.

После успешного save flow:

- sheet сообщает родителю новый `audioUrl`;
- родитель обновляет note row;
- форма и строка используют уже новый URL;
- запускается автоматическое воспроизведение свежего аудио.

## Playback Behavior

Для ручного воспроизведения и автозапуска используется один и тот же клиентский путь:

```ts
function playAudio(audioUrl: string) {
  return new Audio(audioUrl).play().catch(() => {})
}
```

Поведение:

- при ручном клике проигрывается текущий `audioUrl`;
- после регенерации автоматически проигрывается новый `audioUrl`;
- блокировка autoplay браузером не считается ошибкой сценария, потому что кнопка Play уже показана и пользователь может повторить вручную.

## Cache Busting

Регенерация записывает mp3 в тот же storage path (`{userId}/{noteId}.mp3`), поэтому поверх public URL добавляется query-параметр версии:

```ts
`${publicUrl}?v=${Date.now()}`
```

Это гарантирует, что браузер после regenerate берёт именно свежий файл, а не старую версию из cache.

## Save Flow

### Save Changes

- сохраняет fields;
- если primary text изменился и язык ноты поддерживает TTS, сервер возвращает новый `audioUrl`;
- клиент немедленно подменяет локальный audio state;
- новый Play instantly available;
- новый файл сразу пытается проиграться.

### Save & Regenerate Audio

- форсирует TTS даже без изменения текста;
- новый `audioUrl` возвращается в том же ответе server action;
- UI сразу использует новый URL и запускает его без дополнительного пользовательского подтверждения.

Если regenerate не удался:

- save всё равно не падает, если fields уже сохранились;
- server action возвращает `audioError`;
- форма показывает toast с причиной, чтобы регрессии не выглядели как “кнопка ничего не делает”.

## Why `router.refresh()` Is Not Enough

`router.refresh()` полезен как дополнительная серверная синхронизация, но для этой фичи его недостаточно как единственного механизма:

- пользователь видит лаг между save и появлением Play-кнопки;
- в открытом edit-sheet остаётся старое состояние до завершения refresh;
- невозможно гарантировать немедленный запуск именно нового аудио.

Поэтому мгновенное обновление должно происходить из локального client state, а refresh может остаться вторичным способом выровнять серверный snapshot.
