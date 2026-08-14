# ElevenLabs TTS

## Summary

Аудиогенерация для поддерживаемых колод вынесена в общий TTS pipeline: сервер вызывает ElevenLabs, загружает mp3 в Supabase Storage, сохраняет public URL в `audio_cache` и сразу возвращает его UI.

Система поддерживает два режима:

- single-note generation для редактирования ноты и точечных действий;
- batch generation для deck page и filtered subset.

## Account isolation

ElevenLabs расходуется отдельно для каждого пользователя:

- только пользователь с UUID из `ELEVENLABS_OWNER_USER_ID` использует существующий серверный `ELEVENLABS_API_KEY` и системные voice IDs;
- остальные пользователи подключают собственный restricted API key на `/settings/elevenlabs` и выбирают доступные в своём аккаунте голоса для английского, чешского и турецкого;
- сервер проверяет ключ через ElevenLabs `/v1/user` и получает список голосов через `/v1/voices`;
- пользовательский ключ шифруется AES-256-GCM ключом `USER_CREDENTIALS_ENCRYPTION_KEY` и никогда не возвращается клиенту;
- таблица `user_elevenlabs_settings` закрыта для `anon` и `authenticated`; чтение и запись выполняются только сервером через service role после проверки Supabase-сессии;
- voice ID при сохранении сверяется со списком голосов именно подключённого аккаунта.

Если обычный пользователь не подключил ElevenLabs или не выбрал голос для языка, TTS не использует системный fallback и возвращает конфигурационную ошибку. Поэтому чужой пользователь не может расходовать квоту владельца.

## Supported Languages

Для системного аккаунта владельца TTS настроен так:

- `english` через voice `JBFqnCBsd6RMkjVDRZzb` и `language_code = 'en'`;
- `czech` через voice `TX3LPaxmHKxFdv7VOQHJ` и `language_code = 'cs'`.
- `turkish` через профессиональный Voice Library voice Gökçe Deniz (`oPC5I9GKjMReiaM29gjY`) из `ELEVENLABS_TURKISH_VOICE_ID` и `language_code = 'tr'`; переменная обязательна для турецкого TTS.

Все три языковые конфигурации используют один и тот же ElevenLabs model:

- `eleven_flash_v2_5`

Для остальных пользователей язык и модель остаются такими же, а `voice_id` берётся из их персональных настроек.

## Files

- `src/lib/tts.ts`
- `src/lib/server/elevenlabs-account.ts`
- `src/lib/server/secret-encryption.ts`
- `src/lib/actions/elevenlabs.ts`
- `src/components/elevenlabs-settings.tsx`
- `src/app/settings/elevenlabs/page.tsx`
- `src/app/api/tts/route.ts`
- `src/app/api/tts/batch/route.ts`
- `src/lib/note-fields.ts`
- `src/components/generate-audio-button.tsx`
- `src/components/note-editor-form.tsx`
- `src/app/deck/[id]/page.tsx`

## Core Contract

`generateAndCacheAudio(...)` является единым серверным helper для TTS:

- выбирает изолированную учётную запись, затем language-aware `voice_id`, `model_id` и `language_code`;
- загружает итоговый mp3 в bucket `audio`;
- получает public URL;
- добавляет cache-busting query parameter;
- upsert-ит запись в `audio_cache`;
- возвращает `{ audioUrl }` или `{ error }`.

Это позволяет не дублировать TTS-логику между single и batch routes.

## Supported-Language Guard

TTS поддерживается только для языков, описанных в `src/lib/tts-config.ts`.

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

- ограничивает генерацию только поддерживаемыми языками;
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
