# Echo — Feature: Note Editor

## Overview
Возможность редактировать любую ноту (карточку) прямо со страницы колоды (Deck View) и во время сессии повторения (Review Session). Включает перегенерацию аудио через ElevenLabs, если текст карточки изменился.

## Entry Points

### 1. Deck View (страница колоды)
- У каждой ноты в списке появляется иконка-кнопка Edit (например, карандаш).
- Кнопка появляется при наведении (hover) на строку ноты.
- Клик по кнопке открывает модальное окно (Modal/Dialog) или Drawer с формой редактирования ноты.
- После сохранения изменений в редакторе, нота в списке обновляется inline, без полной перезагрузки страницы (оптимистичное обновление или server action revalidation).

### 2. Session View (review-сессия)
- В правом верхнем углу карточки (Flashcard) располагается иконка Edit.
- Клик по иконке открывает боковую панель (Side Panel / Sheet) справа от карточки.
- Важно: сессия изучения не должна прерываться. Карточка сдвигается/остается слева, панель открывается справа от нее.
- После сохранения изменений в панели:
  - Панель закрывается.
  - Сессия продолжается.
  - Текущая карточка немедленно обновляется (новые значения полей) без перехода к следующей карточке.
  - Все остальные карточки в текущей очереди с тем же `note_id` тоже немедленно обновляются, чтобы sibling recognition/production cards не показывали устаревшие поля.

## Functional Requirements
- **Fields to Edit**: Редактор должен позволять менять все поля ноты в зависимости от языка. Для English это канонический набор `word`, `translation`, `level`, `part_of_speech`, `popularity`, `style`, `synonyms`, `antonyms`, `examples_html`. Для Czech это новый канонический набор `word`, `translation`, `level`, `part_of_speech`, `popularity`, `style`, `synonyms`, `antonyms`, `examples_html`, `gender`, `verb_class`, `verb_irregular`, `note`.
- **Canonical Primary Text**: Каноническим полем ноты считается `word`. Legacy-ключи `expression` и `term` допускаются только для обратной совместимости чтения старых записей.
- **Shared Read Path**: Все UI-места, которым нужен основной текст ноты, должны читать его через общий helper `getNotePrimaryText(fields)` с порядком `word -> expression -> term`.
- **Normalization on Save**: При сохранении редактор должен вызывать language-aware normalization. Для English это означает запись только в канонические keys и отказ от новых записей в `expression`, `term`, `example_sentence`, `example_translation`, `frequency`.
- **Czech Schema Cleanup**: Для Czech новые и отредактированные ноты должны сохраняться только в канонические ключи. Legacy-поля вроде `pronunciation`, `example_sentence`, `example_translation`, `image_url`, `notes`, `frequency`, `expression`, `term` больше не считаются частью поддерживаемого контракта.
- **Audio Regeneration**: Если изменяется primary text ноты и язык входит в supported TTS set, необходимо иметь возможность (или сделать это автоматически) перегенерировать аудио через ElevenLabs TTS.
- **Validation Parity**: Кнопка `Save & Regenerate Audio` должна проходить ту же обязательную browser validation, что и обычный submit. Путь forced save не должен позволять сохранить ноту с пустыми required-полями.
- **UI Components**: Использовать shadcn/ui компоненты (Dialog/Sheet, Form, Input, Textarea, Button, Slider).
- **State Management**: Осторожно работать со стейтом сессии, чтобы изменения в ноте корректно отражались в текущем компоненте `ReviewSession`.
