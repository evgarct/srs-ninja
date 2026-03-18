# SRS Ninja — Документация разработки

Этот раздел содержит документацию по реализованным фичам, архитектурным решениям и рабочим паттернам проекта.

---

## Оглавление

| Документ | Описание |
|----------|----------|
| [deck-audio-playback.md](./deck-audio-playback.md) | Deck page audio playback: Play-кнопка в списке нотов и в edit mode, мгновенное появление после генерации/регенерации |
| [extra-study.md](./extra-study.md) | Фича Extra Study: адаптивный подбор карточек, URL-параметры, поведение FSRS при досрочном повторении |
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
