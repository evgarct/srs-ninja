# SRS Ninja — Документация разработки

Этот раздел содержит документацию по реализованным фичам, архитектурным решениям и рабочим паттернам проекта.

---

## Оглавление

| Документ | Описание |
|----------|----------|
| [deck-audio-playback.md](./deck-audio-playback.md) | Deck page audio playback: Play-кнопка в списке нотов и в edit mode, мгновенное появление после генерации/регенерации |
| [elevenlabs-tts.md](./elevenlabs-tts.md) | ElevenLabs TTS pipeline: single-note и batch generation, Storage upload, `audio_cache` и language-aware guards for supported decks |
| [deck-table-view.md](./deck-table-view.md) | Deck table view: full-width таблица колоды, dropdown multi-select filters, preview на реальном Flashcard и batch audio по текущему filtered subset |
| [english-note-schema.md](./english-note-schema.md) | Canonical English note contract: shared field schema, legacy normalization, and alignment across forms, flashcards, and MCP |
| [extra-study.md](./extra-study.md) | Фича Extra Study: адаптивный подбор карточек, URL-параметры, поведение FSRS при досрочном повторении |
| [home-responsive-layout.md](./home-responsive-layout.md) | Responsive-first Home layout: compact nav, calmer summary/streak hierarchy, and one shared mobile-to-desktop composition |
| [mcp-draft-import.md](./mcp-draft-import.md) | MCP draft import: AI-generated candidate notes, draft-first persistence, import batches и ручной approve flow |
| [note-editor.md](./note-editor.md) | Note editor: редактирование ноты из deck page и review session, shared field helpers и audio regeneration |
| [card-ordering.md](./card-ordering.md) | Smart card ordering: tier-based queue, sibling separation, new-card cap и bypass для manual/extra modes |
| [completed-today-deck-state.md](./completed-today-deck-state.md) | Completed-today deck state: persisted due-session completion markers and calm success state on home deck cards |
| [review-learning-loop.md](./review-learning-loop.md) | Review learning loop: `Again/Hard` возвращают карточку в текущую сессию, а same-day extra study становится менее навязчивым |
| [review-flow-dashboard.md](./review-flow-dashboard.md) | Review flow and dashboard due counts: review entry points, optimistic queue UX и home page due inventory |
| [review-completion-summary.md](./review-completion-summary.md) | Review completion summary: richer done state, answer distribution, time spent and restrained completion animation |
| [review-heatmap.md](./review-heatmap.md) | Review Heatmap: Monday-first historical activity grid on `/stats`, mobile/desktop windows и stable layout behavior |
| [review-session-mobile-app-pass.md](./review-session-mobile-app-pass.md) | Review session mobile app pass: compact mobile shell, sticky rating bar, directional card motion and emoji burst |
| [review-session-polish.md](./review-session-polish.md) | Review session polish: stronger progress chrome, stack depth cues and smooth card transitions |
| [review-session-prefetch.md](./review-session-prefetch.md) | Review session prefetch: prepared queue, instant next-card progression и lookahead audio warmup |
| [review-queue-pacing.md](./review-queue-pacing.md) | Review queue pacing: 200-card due-session limit, separate new-card cap и delayed requeue windows for difficult cards |
| [tooling-hygiene.md](./tooling-hygiene.md) | Runtime and tooling hygiene: WSL-first CLI resolution, lint ignores for generated assets, and Next.js `proxy.ts` entrypoint |
| [weekly-activity-widget.md](./weekly-activity-widget.md) | Weekly Activity Widget: 7-дневная активность, streak, masteredWords и tooltip-поведение |

---

## Стек

- **Next.js 16** App Router (Server Components + Server Actions)
- **Supabase** — БД PostgreSQL, аутентификация, клиент
- **ts-fsrs** — алгоритм FSRS-6 для интервального повторения
- **shadcn/ui** — компоненты (Button, Card, Badge, Progress…)
- **Tailwind CSS**

## Структура проекта

```
src/
├── app/                   # Next.js маршруты
│   ├── page.tsx           # Дашборд
│   ├── review/[deckId]/   # Сессия повторения
│   ├── deck/[deckId]/     # Страница колоды
│   └── ...
├── components/            # UI-компоненты
│   ├── review-session.tsx # Основной компонент сессии
│   ├── extra-study-box.tsx# Блок Extra Study
│   └── ui/                # shadcn/ui компоненты
└── lib/
    ├── actions/           # Server Actions
    │   ├── cards.ts       # getDueCards, getExtraStudyCards, submitReview
    │   ├── decks.ts       # getDashboardStats, getDeckWithStats, createDeck
    │   ├── notes.ts       # CRUD заметок
    │   └── stats.ts       # Аналитика и статистика
    ├── fsrs.ts            # Обёртка над ts-fsrs
    ├── types.ts           # Типы домена
    └── supabase/          # Supabase клиент + типы БД
```
