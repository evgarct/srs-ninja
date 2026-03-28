# Echo — Feature: MCP Draft Note Import Pipeline

## Context

Пользователь хочет ускорить наполнение колод через AI, но без риска сразу засорить учебную очередь некачественными карточками.

Желаемый сценарий:

1. взять список слов или фраз;
2. передать его AI;
3. получить готовые candidate notes с переводом, примерами, тегами и дополнительными полями;
4. сохранить результат в выбранную колоду;
5. не выпускать эти notes сразу в обычный review-flow;
6. сначала пометить их как `draft`;
7. на сайте вручную просмотреть, отредактировать, approve и только потом использовать в обычном режиме;
8. аудио при необходимости запускать отдельно и вручную.

Сейчас проект умеет создавать обычные notes, но не имеет отдельного draft-first ingestion flow и не отличает AI-import от обычного ручного создания.

## Goal

Добавить безопасный draft import pipeline, доступный через MCP, который:

- принимает список слов / фраз;
- генерирует candidate notes под schema выбранной колоды;
- сохраняет их как `draft`;
- группирует результат по import batch;
- позволяет просматривать и approve'ить imports уже внутри сайта;
- не запускает аудио и не отправляет notes в scheduler автоматически.

## Product Principles

### 1. Draft First

Любой note, созданный AI-import flow, по умолчанию должен попадать в систему как `draft`.

### 2. Human Approval Required

AI может помогать подготовить note, но не должен автоматически публиковать её в обычную учебную очередь.

### 3. Audio Is Separate

Озвучка не является частью MCP import flow и остаётся отдельным ручным шагом после проверки.

### 4. Imports Must Be Traceable

Система должна позволять понять:

- какой набор слов был импортирован одной операцией;
- какие notes относятся к одному import batch;
- какие notes ещё не approved;
- какие notes уже переведены в активное состояние.

### 5. App Logic Is the Source of Truth

MCP не должен писать в БД в обход прикладной логики приложения.

### 6. MCP Write Failures Must Be Diagnosable

Если `save_draft_notes` не сохранил import, MCP должен вернуть не только факт ошибки, но и диагностический контекст, достаточный для следующей попытки без чтения серверных логов.

Минимально ошибка должна включать:

- tool name
- target `deckId`
- item count
- backend message
- backend `code`, `details`, `hint`, если они доступны

## Primary User Flows

### Flow A. Create Drafts From a Word List

1. Пользователь выбирает колоду.
2. Пользователь передаёт AI список слов / фраз.
3. MCP tool получает deck context и генерирует candidate notes.
4. Пользователь или orchestration flow сохраняет candidates.
5. Система создаёт import batch.
6. Все notes из batch сохраняются как `draft`.
7. Эти notes становятся видны на сайте в draft-review flow.

Если сохранение падает, клиент должен получить диагностическую ошибку с контекстом deck / item count и доступными backend details.

### Flow B. Review and Approve Drafts on the Website

1. Пользователь открывает draft list или draft batch.
2. Пользователь просматривает note.
3. При необходимости пользователь редактирует поля или теги.
4. Пользователь approve'ит note.
5. После approve note становится обычным активным note.
6. Только после этого note может участвовать в обычном review-flow.

### Flow D. Delete Drafts During Review

1. Пользователь открывает draft list или draft batch.
2. Пользователь может удалить отдельную `draft` note.
3. Если это была последняя `draft` note в batch, batch удаляется автоматически, даже если внутри уже остались approved notes.
4. После удаления batch связанные approved notes остаются в системе, но больше не показываются как imported draft batch.
5. Пользователь может удалить batch целиком вручную только если в нём остались только draft notes.
6. Удаление batch удаляет все оставшиеся `draft` notes внутри него.

### Flow C. Optional Audio Generation After Approval

1. Пользователь решает, нужна ли озвучка.
2. Если нужна, он запускает существующий ручной audio flow.
3. Если не нужна, note остаётся обычной approved note без audio.

## Non-Goals

- не генерировать аудио автоматически в момент импорта;
- не делать auto-approve;
- не давать модели unrestricted direct write в production database;
- не требовать exact dedupe before MVP;
- не пытаться сделать fully autonomous content pipeline без ручной проверки;
- не связывать approval, editing и audio generation в одну обязательную операцию.

## Draft Model Requirements

Для draft import нужен явный продуктовый статус note.

### Required Note States

Минимально note должна поддерживать состояния:

- `draft`
- `approved`

### Required Source Tracking

Минимально note должна хранить источник создания:

- `manual`
- `ai_import`

### Required Batch Association

Каждая note, созданная MCP import flow, должна иметь возможность быть привязанной к import batch.

Это нужно для:

- групповой навигации;
- audit trail;
- будущего bulk-approve;
- отладки неудачных импортов.

## Batch Requirements

Система должна поддерживать import batch как отдельную сущность.

### Batch Should Store

- `id`
- `user_id`
- `deck_id`
- `source`
- `status`
- `created_at`
- `updated_at`

### Recommended Optional Batch Metadata

- `input_payload`
- `model_name`
- `prompt_version`
- `notes_count`
- `tags_requested`
- `topic`

### Batch Statuses

Для MVP достаточно:

- `draft`
- `partially_approved`
- `approved`
- `archived`

## Field Generation Requirements

Draft generator должен уметь заполнять note schema проекта под выбранную колоду.

### Minimum Required Candidate Fields

- `word`
- `translation`

### Recommended Candidate Fields

- `part_of_speech`
- `level`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`
- `tags`

## Language-Specific Field Contracts

MCP import не должен угадывать формат fields по свободной форме.

Для MVP contract нужно считать фиксированным для поддерживаемых языков колоды.

### English Decks

Для `english` candidate note может содержать только следующие keys:

- `word`
- `translation`
- `part_of_speech`
- `level`
- `popularity`
- `style`
- `synonyms`
- `antonyms`
- `examples_html`

Обязательные поля:

- `word`
- `translation`

Допустимые enum values:

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
- `popularity`
  - integer `1..10`

### Czech Decks

Для `czech` candidate note может содержать только следующие keys:

- `word`
- `translation`
- `pronunciation`
- `gender`
- `part_of_speech`
- `level`
- `style`
- `popularity`
- `example_sentence`
- `example_translation`
- `note`
- `image_url`

Обязательные поля:

- `word`
- `translation`

Допустимые enum values:

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
- `popularity`
  - integer `1..10`

## Field Value Format Rules

Чтобы import pipeline был предсказуемым, fields должны obey'ить общий формат:

- все значения note fields передаются как строки;
- optional fields при отсутствии передаются как пустая строка или опускаются до normalization step;
- `null` не должен быть основным wire format для note fields;
- `tags` передаются отдельно как `string[]`;
- MCP не должен добавлять поля, которых нет в contract для языка выбранной колоды;
- backend имеет право отбросить неизвестные keys;
- backend имеет право нормализовать primary word через существующие note helpers.

### Deck-Aware Behavior

Генерация candidate notes должна учитывать:

- язык колоды;
- реально поддерживаемые поля note schema;
- формат существующих tags;
- продуктовые ограничения проекта.

Если колода не поддерживает какое-то поле, generator не должен навязывать его в итоговый payload.

## Validation Requirements

Перед сохранением draft notes backend должен:

- проверить ownership и доступ пользователя к deck;
- проверить, что deck существует;
- проверить, что candidate fields совместимы с выбранной колодой;
- нормализовать значения через существующие note helpers;
- отбросить пустые и сломанные entries;
- не создавать note без минимально обязательных полей.

### Validation Should Also Handle

- trim и normalization строк;
- нормализацию tags;
- защиту от полностью пустых example fields;
- защиту от malformed arrays / JSON;
- адекватные ошибки по частично валидному batch input.

## Duplicate Handling

Для MVP не требуется идеальный dedupe engine, но система должна иметь внятную стратегию.

### Minimum Requirement

Backend должен уметь как минимум выявлять потенциальные дубликаты по primary word в пределах той же колоды.

### Acceptable MVP Behavior

Для MVP поведение фиксируется так:

- точные дубликаты не сохраняются;
- similar matches сохраняются как draft notes;
- similar matches несут conflict metadata с ссылкой на matched existing note;
- draft review page позволяет явно выбрать один из вариантов resolution.

Главное требование: конфликтные импорты не должны попадать в систему “молча”.

## Scheduler Requirements

Draft notes не должны попадать в обычный review-flow.

### Required Outcome

Пока note находится в статусе `draft`, она:

- не участвует в обычных due queries;
- не попадает в manual review selection;
- не считается частью активного учебного материала;
- не влияет на обычную статистику review в том же смысле, что approved content.

### Approval Outcome

После approve:

- note становится обычной активной note;
- она может участвовать в scheduler flow;
- если карточки создаются на approve, они создаются именно в этот момент;
- если карточки создаются раньше, scheduler должен жёстко исключать drafts.

## Website UX Requirements

На сайте должен существовать явный draft review flow.

### Minimum UX Scope

- фильтр или отдельный экран для draft notes;
- визуальный indicator, что note является draft;
- просмотр draft notes по import batch;
- возможность редактировать draft;
- возможность approve single draft;
- возможность delete single draft;
- возможность delete draft-only batch;
- drafts не должны смешиваться с обычным review-flow.

### Conflict Review Scope

- при similar match draft review показывает matched existing note;
- можно выбрать `Update existing`;
- можно выбрать `Keep as separate draft`;
- можно выбрать `Ignore match`;
- `Update existing` использует обычную app update logic и не сбрасывает review history/scheduling target note;
- `Keep as separate draft` и `Ignore match` снимают conflict state, но оставляют draft доступным для обычного approve flow.

### Recommended Follow-Up Scope

- bulk approve для batch;
- batch summary;
- conflict warnings;
- batch archive;
- delete partially approved / approved batch.

## MCP Tooling Requirements

### Required Tools

1. `list_decks`
   - возвращает доступные пользователю decks;
   - нужен для безопасного выбора target deck.

2. `save_draft_notes`
   - input:
     - `deckId`
     - `items: DraftCandidate[]`
     - optional `metadata`
   - output:
     - created draft note ids
     - import batch id
     - validation warnings

3. `list_draft_batches`
   - возвращает import batches пользователя.

4. `list_draft_notes`
   - возвращает draft notes по deck и/или batch.

5. `get_deck_contract`
   - возвращает field contract выбранной колоды;
   - нужен, чтобы ChatGPT не гадал по структуре payload.

### Optional Generation Tool

`generate_draft_notes` можно добавить позже как convenience tool, если захочется, чтобы backend сам вызывал LLM.

Для MVP это не обязательно, потому что основной сценарий допускает, что candidate notes генерирует сам ChatGPT, а приложение отвечает за:

- contract discovery;
- validation;
- draft-only persistence;
- approve flow.

### Optional Later Tools

- `approve_draft_note`
- `approve_draft_batch`
- `delete_draft_batch`
- `get_duplicate_candidates`

## MCP Safety Requirements

- write tools должны работать только в контексте authenticated user;
- MCP не должен обходить backend validation;
- destructive tools должны быть недоступны или требовать явного подтверждения;
- MCP не должен иметь unrestricted SQL-like write surface;
- import tool не должен уметь silently publish notes как `approved`.

## Deployment Requirements

MVP должен быть реалистично совместим с:

- Vercel Hobby
- Supabase Free

Это означает:

- простой request flow без избыточной stateful orchestration;
- разумный размер payload batch;
- отсутствие unnecessarily expensive background complexity на старте;
- аккуратное отношение к paused free-tier Supabase project.

## Remote MCP Requirement

Для сценария “ChatGPT сам наполняет колоды” система должна иметь не только internal JSON routes, но и remote MCP endpoint.

Для MVP допустим personal-server режим:

- remote MCP endpoint доступен по одному URL;
- ChatGPT подключается к нему как к custom MCP server;
- сервер может работать через shared-secret access для одного владельца аккаунта;
- write actions всё равно должны идти только через app-level validation и draft-first persistence.

### MVP Auth Contract

Для первой итерации допустим практичный single-user contract:

- `MCP_SHARED_SECRET`
- `MCP_USER_ID`
- `SUPABASE_SERVICE_ROLE_KEY`

Это позволяет ChatGPT работать с конкретным аккаунтом владельца сайта без полноценного OAuth в первой версии.

Полноценный OAuth остаётся рекомендуемым follow-up решением для более широкого и безопасного использования.

## Website Onboarding Requirement

Remote MCP endpoint недостаточно реализовать только на backend уровне.

Если продуктовый сценарий предполагает, что владелец приложения сам подключает ChatGPT, на сайте должен существовать onboarding UI.

### Website Onboarding UI Must

- позволять выбрать поддерживаемый AI agent;
- явно показывать, что в MVP поддержан `ChatGPT`;
- показывать remote MCP endpoint;
- показывать готовый ChatGPT connection URL, если personal MCP config собран;
- позволять скопировать endpoint и connection URL;
- показывать setup status, если не хватает `MCP_SHARED_SECRET` или `MCP_USER_ID`;
- предупреждать, если сервер доступен только на `localhost` и не будет reachable для ChatGPT извне.

### Website Onboarding UI Should Live

Для MVP допустимо расположить этот flow на странице `/import`, рядом с существующим import surface.

## Documentation Requirements

После реализации должны существовать:

- `specs/` документ про draft import behavior;
- `docs/` документ про technical architecture;
- описание data model;
- описание MCP tool contract;
- описание draft approval flow.

## Tests Requirement

После реализации минимально нужны automated tests на:

- validation и normalization draft payload;
- batch grouping behavior;
- deterministic similar-conflict matcher;
- scheduler exclusion для drafts;
- approve transition `draft -> approved`;
- duplicate-handling helper, если он вынесен в чистую функцию;
- conflict resolution flow for keep separate / ignore / update existing;
- MCP-facing service contract, если он реализован через чистый application layer.

## Acceptance Criteria

- [ ] Список слов можно преобразовать в candidate notes через MCP.
- [ ] Candidate notes сохраняются в выбранную колоду как `draft`, а не как сразу активные notes.
- [ ] Draft notes можно отличить от approved notes на уровне модели данных.
- [ ] Draft notes можно группировать по import batch.
- [ ] Similar matches сохраняются как drafts с conflict metadata и видны в draft review.
- [ ] Draft notes не попадают в обычный review до approve.
- [ ] На сайте существует draft review flow для просмотра и approve imported notes.
- [ ] Draft review показывает matched existing note и позволяет update existing / keep separate / ignore match.
- [ ] Approval переводит note в обычное активное состояние.
- [ ] Audio generation остаётся ручным действием после проверки.
- [ ] MCP не пишет в БД в обход backend validation.
- [ ] У приложения есть remote MCP endpoint, к которому ChatGPT можно подключить как custom MCP server.
- [ ] На сайте есть onboarding UI, через который можно взять готовый connection URL и понять, как подключить ChatGPT.
- [ ] После реализации для draft import добавлены docs и automated tests.

## Example Payloads

### English Draft Save Example

```json
{
  "deckId": "english-deck-uuid",
  "items": [
    {
      "fields": {
        "word": "anchor",
        "translation": "якорь",
        "part_of_speech": "noun",
        "level": "B1",
        "popularity": 6,
        "style": "neutral",
        "synonyms": ["hook", "mooring"],
        "antonyms": ["drift"],
        "examples_html": "<ul><li>Drop the <b>anchor</b> before the storm.</li><li>The <b>anchor</b> held all night.</li></ul>"
      },
      "tags": ["English::topic.travel", "English::style.neutral", "English::level.b1", "English::noun"]
    }
  ],
  "metadata": {
    "modelName": "gpt-5.4",
    "promptVersion": "draft-import-v1",
    "topic": "travel",
    "requestedTags": ["English::topic.travel", "English::style.neutral", "English::level.b1", "English::noun"]
  }
}
```

### Czech Draft Save Example

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
        "popularity": "6",
        "example_sentence": "Ta kniha je velmi zajímavá.",
        "example_translation": "Эта книга очень интересная.",
        "note": "Базовое существительное.",
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
