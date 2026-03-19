# ElevenLabs TTS

## Summary

Аудиогенерация для английских колод вынесена в общий TTS pipeline: сервер вызывает ElevenLabs, загружает mp3 в Supabase Storage, сохраняет public URL в `audio_cache` и сразу возвращает его UI.

Система поддерживает два режима:

- single-note generation для редактирования ноты и точечных действий;
- batch generation для deck page и filtered subset.

## Files

- `src/lib/tts.ts`
- `src/app/api/tts/route.ts`
- `src/app/api/tts/batch/route.ts`
- `src/lib/note-fields.ts`
- `src/components/generate-audio-button.tsx`
- `src/components/note-editor-form.tsx`
- `src/app/deck/[id]/page.tsx`

## Core Contract

`generateAndCacheAudio(...)` является единым серверным helper для TTS:

- вызывает ElevenLabs с фиксированными `voice_id` и `model_id`;
- загружает итоговый mp3 в bucket `audio`;
- получает public URL;
- добавляет cache-busting query parameter;
- upsert-ит запись в `audio_cache`;
- возвращает `{ audioUrl }` или `{ error }`.

Это позволяет не дублировать TTS-логику между single и batch routes.

## English-Only Guard

TTS поддерживается только для `english` deck language.

Guard живёт не только в UI, но и на сервере:

- `/api/tts/batch` проверяет язык колоды до генерации;
- note edit flow вызывает TTS только через `shouldGenerateAudioForNote(...)`;
- primary text читается через shared helper, а не через raw legacy keys.

## Storage and Cache

Файл всегда записывается по стабильному пути:

- `{userId}/{noteId}.mp3`

Чтобы браузер после regenerate не проигрывал старый файл из cache, public URL versioned:

```ts
`${publicUrl}?v=${Date.now()}`
```

Именно этот versioned URL сохраняется в `audio_cache.storage_path`.

## Single-Note Route

`/api/tts` принимает:

- `noteId`
- `text`
- `language`

Route:

- проверяет auth;
- валидирует payload;
- вызывает `generateAndCacheAudio(...)`;
- возвращает новый `audioUrl`.

Этот путь нужен для inline note editing и ручной регенерации.

## Batch Route

`/api/tts/batch` принимает:

- `deckId`
- optional `noteIds`

Поведение batch route:

- ограничивает генерацию английскими колодами;
- загружает ноты колоды или только переданный subset;
- исключает `note_id`, у которых уже есть `audio_cache`;
- читает canonical primary text через `getNotePrimaryText(fields)`;
- делает rate limit между ElevenLabs requests;
- возвращает агрегированную статистику и `generatedAudio[]`.

`generatedAudio[]` нужен deck page, чтобы локально обновить `audioMap` без reload.

## UI Integration

Deck page и note editor используют один и тот же контракт:

- сервер возвращает новый `audioUrl`;
- клиент локально обновляет состояние;
- Play-кнопка появляется сразу;
- свежий mp3 можно проиграть немедленно.

За счёт этого `router.refresh()` остаётся вторичной синхронизацией, а не основным UX-механизмом.
