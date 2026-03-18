# SRS Ninja — Документация разработки

Этот раздел содержит документацию по реализованным фичам, архитектурным решениям и рабочим паттернам проекта.

---

## Оглавление

| Документ | Описание |
|----------|----------|
| [deck-audio-playback.md](./deck-audio-playback.md) | Deck page audio playback: Play-кнопка в списке нотов и в edit mode, мгновенное появление после генерации/регенерации |
| [deck-table-view.md](./deck-table-view.md) | Deck table view: full-width таблица колоды, dropdown multi-select filters, preview на реальном Flashcard и batch audio по текущему filtered subset |
| [english-note-schema.md](./english-note-schema.md) | Canonical English note contract: shared field schema, legacy normalization, and alignment across forms, flashcards, and MCP |
| [extra-study.md](./extra-study.md) | Фича Extra Study: адаптивный подбор карточек, URL-параметры, поведение FSRS при досрочном повторении |
| [mcp-draft-import.md](./mcp-draft-import.md) | MCP draft import: AI-generated candidate notes, draft-first persistence, import batches и ручной approve flow |
| [review-learning-loop.md](./review-learning-loop.md) | Review learning loop: `Again/Hard` возвращают карточку в текущую сессию, а same-day extra study становится менее навязчивым |
| [review-session-prefetch.md](./review-session-prefetch.md) | Review session prefetch: prepared queue, instant next-card progression и lookahead audio warmup |
| [weekly-activity-widget.md](./weekly-activity-widget.md) | Weekly Activity Widget: 7-дневная активность, streak, masteredWords и tooltip-поведение |

---

## Стек

- **Next.js 14** App Router (Server Components + Server Actions)
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
