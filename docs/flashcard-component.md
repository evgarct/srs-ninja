# Flashcard Component

Компонент карточки для сессий повторения — ключевой UI-элемент SRS Ninja.

## Расположение файлов

```
src/components/flashcard/
├── Flashcard.tsx          # Основной компонент
├── Flashcard.stories.tsx  # Storybook истории (12 вариантов)
├── LevelBadge.tsx         # Бейдж уровня CEFR
├── LevelBadge.stories.tsx
├── FrequencyBar.tsx       # Полоска частотности
├── FrequencyBar.stories.tsx
├── PlayButton.tsx         # Кнопка воспроизведения аудио
├── PlayButton.stories.tsx
├── RatingButtons.tsx      # Кнопки оценки (Again/Hard/Good/Easy)
├── RatingButtons.stories.tsx
├── ExamplesList.tsx       # Список примерных предложений
├── ExamplesList.stories.tsx
└── index.ts               # Barrel export
```

## Использование

```tsx
import { Flashcard } from "@/components/flashcard"

<Flashcard
  expression="konev"
  translation="лейка"
  examples={[
    "Na zahradě jsme použili <b>konev</b> na zalévání.",
    "Děti si hrály s vodou z <b>konve</b>.",
  ]}
  level="A1"
  partOfSpeech="podstatné jméno"
  gender="ženský"
  frequency={7}
  style="🎓 Neutrální"
  note="č. mn.: konve"
  language="czech"
  direction="recognition"
  isRevealed={isRevealed}
  onReveal={() => setIsRevealed(true)}
  onRate={(rating) => handleRating(rating)}
  intervals={{ again: "<10m", hard: "<15m", good: "18d", easy: "29d" }}
/>
```

Примечание: `Flashcard` по-прежнему принимает проп `expression`, но на уровне данных ноты каноническим считается `fields.word`. Для обратной совместимости чтение идет в порядке `word -> expression -> term`.

## Props

| Prop | Тип | Обязательный | Описание |
|---|---|---|---|
| `expression` | `string` | ✓ | Слово на изучаемом языке |
| `translation` | `string` | ✓ | Перевод слова |
| `examples` | `string[]` | ✓ | Примеры предложений (с тегами `<b>`) |
| `level` | `'A1'–'C2'` | ✓ | Уровень CEFR |
| `partOfSpeech` | `string` | ✓ | Часть речи |
| `gender` | `string` | — | Род (только для чешского) |
| `frequency` | `number` (1–10) | ✓ | Частотность слова |
| `style` | `string` | ✓ | Стилистическая пометка с эмодзи |
| `note` | `string` | — | Грамматическая пометка (только для чешского) |
| `audioUrl` | `string` | — | URL аудио (если не указан — кнопка Play скрыта) |
| `language` | `'czech' \| 'english'` | ✓ | Язык карточки |
| `direction` | `'recognition' \| 'production'` | ✓ | Направление повторения |
| `isRevealed` | `boolean` | ✓ | Открыта ли обратная сторона |
| `onReveal` | `() => void` | ✓ | Коллбэк при открытии |
| `onRate` | `(r: 1\|2\|3\|4) => void` | ✓ | Коллбэк при оценке |
| `onPlayAudio` | `() => void` | — | Коллбэк при нажатии Play |
| `intervals` | `{ again, hard, good, easy: string }` | — | Строки интервалов от FSRS (для кнопок) |

### Источник данных

- Для отображения и TTS первичный текст ноты должен читаться через общий helper `getNotePrimaryText(fields)`.
- Helper использует порядок `word -> expression -> term`.
- При сохранении формы `normalizeNoteFields(fields)` синхронизирует legacy-ключи `expression` и `term` с каноническим `word`, если эти ключи уже присутствуют в записи.

## Четыре визуальных состояния

| Состояние | Показывает | Скрывает |
|---|---|---|
| **Recognition / Front** | Слово, примеры, метаданные | Перевод |
| **Recognition / Back** | Всё + перевод + кнопки оценки | — |
| **Production / Front** | Перевод, метаданные | Слово, примеры, Play |
| **Production / Back** | Всё + слово + примеры + Play + кнопки | — |

## Клавиатурные шорткаты

| Клавиша | Действие |
|---|---|
| `Space` | Открыть обратную сторону |
| `1` | Оценить: Again |
| `2` | Оценить: Hard |
| `3` | Оценить: Good |
| `4` | Оценить: Easy |

## Подкомпоненты

### `LevelBadge`
Цветной квадрат + текст уровня CEFR. Цвета:

| Уровень | Цвет |
|---|---|
| A1 | `#22c55e` зелёный |
| A2 | `#eab308` жёлтый |
| B1 | `#3b82f6` синий |
| B2 | `#a855f7` фиолетовый |
| C1 | `#f97316` оранжевый |
| C2 | `#7c3aed` тёмно-фиолетовый |

### `FrequencyBar`
10 блоков `▰▰▰▰▱▱▱▱▱▱` + число. Не `<progress>`.

### `PlayButton`
Круглая кнопка с иконкой `Volume2`. Принимает `onPlay: () => void`. Показывается только когда слово видно и `audioUrl` указан. Реального воспроизведения нет — только проксирует коллбэк.

### `RatingButtons`
4 кнопки в ряд. Каждая — цветная, с подписью интервала и подсказкой клавиши.

### `ExamplesList`
Список предложений. Рендерит теги `<b>` через `dangerouslySetInnerHTML` (данные только из нашей БД).

## Темы

Компонент использует CSS-переменные Tailwind (`bg-card`, `text-foreground`, `text-muted-foreground` и т.д.) и автоматически поддерживает light и dark темы. Цвета бейджей CEFR постоянны в обоих темах.

## Анимации

- Перевод появляется плавно через CSS `max-height` transition (без layout shift)
- Кнопки оценки плавно появляются снизу после reveal
- Play button масштабируется при hover/active

## Storybook

```bash
npm run storybook
# → http://localhost:6006
# Группа: Flashcard/
```

Истории: Czech/English × 4 состояния, With Audio, Dark/Light Theme, All CEFR Levels, Rating Buttons Visible.
