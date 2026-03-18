# MCP Draft Import

## Summary

Для сценария “дать AI список слов, получить заполненные notes, сохранить их как drafts и дальше проверить на сайте” проекту нужен не прямой database-MCP, а product-level draft import pipeline.

Рекомендуемая архитектура:

- remote MCP server как orchestration layer;
- backend приложения как source of truth;
- Supabase как storage layer;
- website draft review flow как обязательный human-in-the-loop шаг.

Это позволяет использовать AI для ускорения наполнения колод, но не выпускать AI-content в обычный scheduler без ручной проверки.

В этой ветке реализован MVP этого pipeline:

- `draft`/`approved` note model;
- `import_batches`;
- отдельная draft review page;
- approve flow с созданием review cards в момент approve;
- MCP-friendly JSON routes;
- remote MCP endpoint на `/api/mcp`.

## Current State

Сейчас проект уже умеет:

- создавать обычные notes через `createNote()`;
- нормализовать поля через `normalizeNoteFields()`;
- создавать recognition / production cards сразу после создания note;
- использовать notes в обычном review-flow.

Сейчас проект не умеет:

- хранить note в состоянии `draft`;
- отслеживать import batches;
- отделять `manual` note creation от `ai_import`;
- исключать drafts из scheduler как first-class behavior;
- проводить approve flow на уровне доменной модели.

## Design Decision

### Chosen Direction

Для этого кейса MCP должен вызывать прикладной backend workflow, а не писать прямо в таблицы Supabase.

### Why Not Direct Supabase MCP Writes

Прямой write access в Supabase плохо подходит под этот продуктовый сценарий, потому что:

- модели нужен не generic CRUD, а конкретный workflow с `draft` semantics;
- notes должны валидироваться и нормализоваться по правилам приложения;
- imports нужно группировать по batch;
- approval должен оставаться явным пользовательским шагом;
- scheduler не должен случайно увидеть неаппрувленный контент.

Иными словами, задача не в том, чтобы “записать row в таблицу”, а в том, чтобы провести note через безопасный продуктовый pipeline.

## Proposed Architecture

## Layer 1. Remote MCP Server

MCP server даёт наружу только tools.

Рекомендуемый минимальный surface:

- `list_decks`
- `save_draft_notes`
- `list_draft_batches`
- `list_draft_notes`
- `get_deck_contract`

Его обязанности:

- принять запрос из ChatGPT developer mode или другого MCP client;
- вызвать продуктовый backend contract;
- вернуть structured result;
- не хранить собственную business state model.

Его обязанности не включают:

- raw SQL;
- scheduler logic;
- final approval logic;
- скрытый bypass validation.

Текущее состояние проекта:

- remote MCP transport уже добавлен на `/api/mcp`;
- app backend surface для него живёт в `src/app/api/mcp/*` и `src/lib/mcp-server.ts`.

## Layer 2. App Backend

Это основной слой правил.

Здесь должны жить:

- проверка прав доступа к deck;
- deck-aware validation payload;
- normalization note fields;
- dedupe checks;
- создание import batch;
- создание draft notes;
- approval logic.

Практически это может быть реализовано через:

- server actions;
- route handlers;
- shared application services в `src/lib`.

Главное требование: MCP вызывает именно этот слой, а не базу напрямую.

## Layer 3. Supabase

Supabase остаётся persistence layer для:

- `notes`
- `cards`
- `import_batches`
- связанных audit metadata

## Recommended Data Model

## Notes

`notes` стоит расширить следующими полями:

- `status text not null default 'approved'`
- `source text not null default 'manual'`
- `import_batch_id uuid null`

### Meaning

- `status`
  - `draft | approved`
- `source`
  - `manual | ai_import`
- `import_batch_id`
  - связь с import batch

Это позволит:

- отличать черновики от активных notes;
- понимать источник note;
- удобно группировать imported notes.

## Import Batches

Новая таблица `import_batches`:

- `id uuid primary key`
- `user_id uuid not null`
- `deck_id uuid not null`
- `source text not null`
- `status text not null default 'draft'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Рекомендуемые optional metadata:

- `input_payload jsonb`
- `model_name text`
- `prompt_version text`
- `notes_count integer`
- `topic text`
- `requested_tags text[]`

### Why Batch Entity Matters

Batch entity нужен не только для истории.

Он решает сразу несколько задач:

- навигация по одному импорту;
- bulk approve в будущем;
- conflict analysis;
- traceability и debugging;
- аудит AI-import behavior.

## Cards Creation Strategy

Есть два рабочих варианта.

### Option A. Create Cards on Approve

`draft` note создаётся без карточек.

Плюсы:

- scheduler физически не может случайно увидеть draft;
- меньше “защитного кода” в review queries;
- approval семантически завершает публикацию note.

Минусы:

- approve становится более активной доменной операцией;
- нужен явный card creation step при approve.

### Option B. Create Cards Immediately but Exclude Drafts Everywhere

Карточки создаются сразу, но все review queries фильтруют только approved notes.

Плюсы:

- approval проще;
- cards already exist.

Минусы:

- выше риск регрессии, если где-то забудем фильтр по `notes.status`;
- scheduler, stats и selection helpers становятся более хрупкими.

### Recommended Choice

Для этого проекта я рекомендую **Option A**: создавать cards при approve.

Это безопаснее для draft-first workflow и лучше соответствует ожиданию “черновик ещё не опубликован”.

Именно этот вариант реализован в текущей ветке.

## Candidate Note Contract

Draft generator должен отдавать payload, совместимый с текущей note schema проекта.

Ориентир по полям:

- `word`
- `translation`
- `pronunciation`
- `part_of_speech`
- `level`
- `style`
- `frequency`
- `example_sentence`
- `example_translation`
- `notes`
- `image_url`
- `tags`

## Current Field Schemas

Чтобы MCP import не зависел от “интуиции” модели, contract для полей лучше считать фиксированным и language-aware.

### English Decks

Поддерживаемые field keys:

- `word`
- `translation`
- `pronunciation`
- `part_of_speech`
- `level`
- `style`
- `example_sentence`
- `example_translation`
- `notes`

Required:

- `word`
- `translation`

Enum constraints:

- `part_of_speech`
  - `noun`
  - `verb`
  - `adjective`
  - `adverb`
  - `pronoun`
  - `preposition`
  - `conjunction`
  - `phrasal verb`
  - `expression`
  - `idiom`
  - `collocation`
- `level`
  - `A1`
  - `A2`
  - `B1`
  - `B2`
  - `C1`
  - `C2`
- `style`
  - `informal`
  - `neutral`
  - `formal`
  - `everyday`
  - `technical`
  - `academic`
  - `narrative`
  - `slang`
  - `poetic`

### Czech Decks

Поддерживаемые field keys:

- `word`
- `translation`
- `pronunciation`
- `gender`
- `part_of_speech`
- `level`
- `style`
- `frequency`
- `example_sentence`
- `example_translation`
- `notes`
- `image_url`

Required:

- `word`
- `translation`

Enum constraints:

- `gender`
  - `mužský`
  - `ženský`
  - `střední`
  - `—`
- `part_of_speech`
  - `podstatné jméno`
  - `sloveso`
  - `přídavné jméno`
  - `příslovce`
  - `zájmeno`
  - `předložka`
  - `spojka`
  - `částice`
  - `citoslovce`
  - `číslovka`
- `level`
  - `A1`
  - `A2`
  - `B1`
  - `B2`
  - `C1`
  - `C2`
- `style`
  - `informal`
  - `neutral`
  - `formal`
  - `everyday`
  - `technical`
  - `academic`
  - `narrative`
  - `slang`
  - `poetic`
- `frequency`
  - `1`
  - `2`
  - `3`
  - `4`
  - `5`

## Payload Format Rules

Рекомендуемый MCP wire contract:

- `fields` это `Record<string, string>`
- все значения полей передаются строками
- optional fields могут быть опущены до backend normalization, но не должны приходить в виде произвольных nested objects
- `tags` передаются отдельно как `string[]`
- неизвестные keys backend должен игнорировать или отклонять

Это упростит:

- prompt contract для AI generation;
- validation;
- typed application services;
- future migrations field schema без расплывчатого JSON behavior.

При этом generator должен быть deck-aware:

- не все колоды обязаны использовать одинаковый набор полей;
- payload должен подстраиваться под `deck.language` и schema;
- лишние поля не должны silently ломать import.

## Validation and Normalization

Backend draft-import service должен переиспользовать существующие product rules, а не дублировать их в MCP.

Нужны как минимум:

- проверка доступа пользователя к deck;
- проверка существования deck;
- `normalizeNoteFields()`;
- primary text validation через существующие helpers;
- trim / cleanup строк;
- cleanup tags;
- защита от пустых entries;
- защита от malformed candidate payload.

## Duplicate Handling

Для MVP не нужен сложный dedupe engine, но нужно ясное поведение.

Рекомендуемый минимум:

- искать точные или почти точные совпадения по primary word в пределах той же колоды;
- возвращать warnings по conflicts;
- не создавать явные дубликаты полностью молча.

Практичный MVP вариант:

- `save_draft_notes` возвращает:
  - `created`
  - `skipped`
  - `warnings`

## Proposed Backend Contracts

## `saveDraftNotes`

Input:

- `deckId`
- `candidateNotes`
- optional `batchMetadata`
- optional `allowDuplicates`

Output:

- `batchId`
- `createdNoteIds`
- `skippedItems`
- `warnings`

Практический MVP workflow:

- ChatGPT вызывает `list_decks`
- затем `get_deck_contract`
- генерирует candidate notes уже у себя
- и сохраняет их через `save_draft_notes`

## `getDeckContract`

Input:

- `deckId`

Output:

- `deck`
- language-aware field contract

Это снимает с ChatGPT необходимость угадывать допустимые keys и enum values.

## `listDraftBatches`

Input:

- optional `deckId`

Output:

- batches с aggregate metadata

## `listDraftNotes`

Input:

- `deckId`
- optional `batchId`

Output:

- draft notes

## `approveDraftNote`

Input:

- `noteId`

Behavior:

- перевести note в `approved`;
- создать review cards, если используется approve-time creation;
- оставить существующие fields и tags без потери данных.

## Website UX Direction

На сайте должен быть явный draft review flow.

Минимальный scope:

- draft filter или отдельная draft page;
- batch-aware navigation;
- draft badge;
- single-note edit;
- single-note approve;
- drafts не участвуют в обычном review до approve.

Текущее MVP-решение:

- отдельная страница `/deck/[id]/drafts`;
- переход на неё с deck page и dashboard, если у колоды есть drafts;
- локальное обновление draft list после approve без перезагрузки.

Желательное follow-up развитие:

- bulk approve;
- batch summary;
- conflict review;
- archive / delete batch actions.

## Audio Behavior

AI-import не запускает TTS автоматически.

Поведение должно быть таким:

- import создаёт только drafts;
- approve делает note обычной;
- пользователь сам решает, нужно ли генерировать audio;
- audio flow переиспользует уже существующие механизмы проекта.

Это важно, потому что:

- не весь контент требует TTS;
- пользователю может понадобиться сначала проверить или отредактировать examples;
- автоозвучка увеличивает стоимость и latency без гарантии качества.

## Example Save Payloads

### English

```json
{
  "deckId": "english-deck-uuid",
  "items": [
    {
      "fields": {
        "word": "anchor",
        "translation": "якорь",
        "pronunciation": "/ˈæŋ.kər/",
        "part_of_speech": "noun",
        "level": "B1",
        "style": "neutral",
        "example_sentence": "Drop the anchor before the storm.",
        "example_translation": "Брось якорь перед штормом.",
        "notes": "Common nautical noun."
      },
      "tags": ["ENGLISH::travel", "ENGLISH::nautical"]
    }
  ],
  "metadata": {
    "modelName": "gpt-5.4",
    "promptVersion": "draft-import-v1",
    "topic": "travel",
    "requestedTags": ["ENGLISH::travel", "ENGLISH::nautical"]
  }
}
```

### Czech

```json
{
  "deckId": "czech-deck-uuid",
  "items": [
    {
      "fields": {
        "word": "kniha",
        "translation": "книга",
        "pronunciation": "/ˈkɲɪɦa/",
        "gender": "ženský",
        "part_of_speech": "podstatné jméno",
        "level": "A1",
        "style": "neutral",
        "frequency": "3",
        "example_sentence": "Ta kniha je velmi zajímavá.",
        "example_translation": "Эта книга очень интересная.",
        "notes": "Базовое существительное.",
        "image_url": "https://example.com/book.jpg"
      },
      "tags": ["CZECH::books", "CZECH::a1"]
    }
  ],
  "metadata": {
    "modelName": "gpt-5.4",
    "promptVersion": "draft-import-v1",
    "topic": "books",
    "requestedTags": ["CZECH::books", "CZECH::a1"]
  }
}
```

## Deployment Notes

Эта архитектура реалистично совместима с:

- Vercel Hobby
- Supabase Free

Для MVP main constraint здесь не throughput, а операционная простота.

Поэтому дизайн должен быть:

- request-light;
- idempotent where practical;
- не завязанным на сложные background workflows;
- устойчивым к cold starts и free-tier pause behavior.

## Security Notes

Если MCP будет использоваться из ChatGPT developer mode:

- лучше подключать remote MCP server, а не прямой database connector;
- write tools должны быть строго user-scoped;
- destructive actions не стоит давать на первом этапе;
- save operations должны всегда идти через app-level validation.

## Implemented Routes

Текущие JSON contracts:

- `GET|POST|DELETE /api/mcp`
- `GET /api/mcp/decks`
- `GET /api/mcp/decks/[deckId]/contract`
- `GET /api/mcp/drafts?deckId=...&batchId=...`
- `POST /api/mcp/drafts`
- `GET /api/mcp/draft-batches?deckId=...`
- `POST /api/mcp/drafts/[id]/approve`

## Personal MCP Mode

Чтобы ChatGPT реально мог подключиться к серверу в первой версии без полноценного OAuth, добавлен practical single-user mode.

Он использует:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MCP_SHARED_SECRET`
- `MCP_USER_ID`

Поведение:

- если запрос приходит с валидным shared secret, MCP server работает от имени фиксированного владельца аккаунта;
- если shared secret не передан, сервер может работать через обычную web-session;
- для ChatGPT рекомендуется подключать сервер как:
  - `https://your-domain/api/mcp?token=YOUR_MCP_SHARED_SECRET`

Это удобно для personal workflow, но не считается финальной multi-user auth моделью.

Для более безопасного и масштабируемого сценария следующим этапом стоит перейти на OAuth.

## Import UI

Помимо backend transport, в приложении теперь есть user-facing onboarding flow на `/import`.

Он нужен, чтобы пользователь мог не искать MCP руками по документации, а подключить ChatGPT прямо из интерфейса.

### Что показывает UI

- выбор AI agent;
- текущий app origin;
- remote MCP endpoint;
- готовый connection URL для ChatGPT в personal MCP mode;
- copy buttons для endpoint и connection URL;
- явный config status, если не хватает `MCP_SHARED_SECRET` или `MCP_USER_ID`;
- предупреждение, если приложение открыто только на `localhost` и ChatGPT не сможет достучаться до него напрямую.

### Current Agent Support

В первой версии реально подключается `ChatGPT`.

Другие агенты в UI могут быть показаны как future placeholders, но не должны выглядеть как готовая интеграция.

### UX Goal

Пользовательский flow должен выглядеть так:

1. Открыть `/import`.
2. Выбрать `ChatGPT`.
3. Скопировать готовый connection URL.
4. Добавить server в ChatGPT как custom MCP connection.
5. Использовать MCP tools для draft import.
6. Вернуться в SRS Ninja и проверить drafts через website review flow.

## Rollout Plan

1. Добавить draft-capable schema:
   - `notes.status`
   - `notes.source`
   - `notes.import_batch_id`
   - `import_batches`
2. Добавить application-layer draft services.
3. Добавить website draft review UI.
4. Добавить MCP-friendly JSON routes для `list_decks`, `get_deck_contract`, `save_draft_notes`, `list_draft_batches`, `list_draft_notes`.
5. Поверх этих routes поднять remote MCP transport.
6. Добавить bulk approve и duplicate warnings как follow-up.

## Suggested Test Plan

После реализации нужны как минимум:

- unit tests для validation / normalization draft payload;
- unit tests для duplicate detection helper;
- tests на `draft -> approved` transition;
- tests на scheduler exclusion drafts;
- tests на batch grouping;
- integration-style tests на application service, если он отделён от transport слоя.

## File Targets

Ключевые файлы текущей реализации:

- `src/lib/actions/notes.ts`
- `src/lib/actions/drafts.ts`
- `src/lib/note-fields.ts`
- `src/lib/draft-import.ts`
- `src/lib/draft-import-service.ts`
- `src/lib/draft-import.test.ts`
- `src/lib/mcp-auth.ts`
- `src/lib/mcp-server.ts`
- `src/lib/mcp-connection.ts`
- `src/lib/mcp-connection.test.ts`
- `src/lib/note-cards.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/actions/decks.ts`
- `src/lib/actions/cards.ts`
- `src/app/api/mcp/*`
- `src/app/import/page.tsx`
- `src/app/deck/[id]/drafts/page.tsx`
- `src/components/copy-button.tsx`
- `src/components/mcp-connect-panel.tsx`
- `src/components/draft-review-client.tsx`
- `src/components/approve-draft-button.tsx`
- `src/components/draft-status-badge.tsx`
- `src/components/draft-status-badge.stories.tsx`
- `supabase/migrations/20260318145957_mcp_draft_import.sql`

## Open Questions

Перед реализацией ещё надо решить:

1. Нужен ли отдельный drafts page или достаточно draft-filter в deck page?
2. Нужен ли вообще отдельный `generate_draft_notes`, или ChatGPT будет генерировать candidates сам и использовать только `save_draft_notes`?
3. Какой MVP dedupe policy выбрать:
   - skip
   - warn
   - allow with explicit flag
4. Нужно ли сразу поддерживать bulk approve?

Эти вопросы не блокируют архитектурное направление, но влияют на объём первой итерации.
