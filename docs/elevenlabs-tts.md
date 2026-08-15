# ElevenLabs TTS

## Summary

Аудиогенерация для поддерживаемых колод вынесена в общий TTS pipeline: сервер вызывает ElevenLabs, загружает mp3 в Supabase Storage, сохраняет public URL в `audio_cache` и сразу возвращает его UI.

Система поддерживает два режима:

- single-note generation для редактирования ноты и точечных действий;
- batch generation для deck page и filtered subset.

## Account isolation

ElevenLabs расходуется отдельно для каждого пользователя:

- каждый пользователь подключает собственный restricted API key на `/settings/elevenlabs` и выбирает доступные в своём аккаунте голоса для английского, чешского и турецкого;
- системного owner/fallback подключения нет: квота, доступные голоса и ошибки всегда относятся к аккаунту текущего пользователя;
- сервер получает тариф через ElevenLabs subscription API и загружает все страницы `/v2/voices`; `/v1/shared-voices` не используется;
- пользовательский ключ шифруется AES-256-GCM ключом `USER_CREDENTIALS_ENCRYPTION_KEY` и никогда не возвращается клиенту;
- таблица `user_elevenlabs_settings` закрыта для `anon` и `authenticated`; чтение и запись выполняются только сервером через service role после проверки Supabase-сессии;
- voice ID при сохранении сверяется со списком голосов именно подключённого аккаунта.

Если пользователь не подключил ElevenLabs или не выбрал голос для языка, TTS не использует системный fallback и возвращает конфигурационную ошибку. Поэтому один пользователь не может расходовать квоту другого.

Если сохранённый ключ был отозван, повреждён или больше не принимается ElevenLabs, страница настроек остаётся доступной: она показывает состояние, требующее переподключения, и сохраняет рабочую кнопку отключения. Ошибка провайдера не должна ломать серверный рендер страницы.

## Supported Languages

Каждый язык использует voice ID, выбранный текущим пользователем из его ElevenLabs-аккаунта:

- `english` с `language_code = 'en'`;
- `czech` с `language_code = 'cs'`;
- `turkish` с `language_code = 'tr'`.

Страница настроек объясняет создание restricted key, шифрование и выбор голосов. Для каждого языка используется portal-based Combobox с поиском и ручным вводом ID. Сначала показываются голоса, у которых `verified_languages` содержит нужный `en`, `cs` или `tr`, затем остальные голоса из авторизованного `/v2/voices` с предупреждением о неподтверждённом произношении. Наличие в `/v2/voices` является источником истины доступности аккаунту; `available_for_tiers` отображается как метаинформация и не отсекает пользовательские или клонированные голоса. Перед сохранением сервер повторно загружает все страницы и отклоняет отсутствующие ID.

Все три языковые конфигурации используют один и тот же ElevenLabs model:

- `eleven_flash_v2_5`

Модель общая, а `voice_id` для каждого языка всегда берётся из персональных настроек текущего пользователя.

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
- один раз до загрузки нот проверяет доступность пользовательского аккаунта и выбранного для языка голоса;
- загружает ноты колоды или только переданный subset;
- исключает `note_id`, у которых уже есть `audio_cache`;
- читает canonical primary text через `getNotePrimaryText(fields)`;
- делает rate limit между ElevenLabs requests;
- возвращает агрегированную статистику и `generatedAudio[]`.

Один resolved TTS context переиспользуется для всей пачки. Поэтому заведомо отсутствующая конфигурация завершается до цикла и не создаёт 500-миллисекундную задержку на каждую ноту.

`generatedAudio[]` нужен deck page, чтобы локально обновить `audioMap` без reload.

## UI Integration

Deck page и note editor используют один и тот же контракт:

- сервер возвращает новый `audioUrl`;
- клиент локально обновляет состояние;
- Play-кнопка появляется сразу;
- свежий mp3 можно проиграть немедленно.

За счёт этого `router.refresh()` остаётся вторичной синхронизацией, а не основным UX-механизмом.
