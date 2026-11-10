# Android app, iteration 1 (review flow) — expected behavior

## Goal
A native Android app runs the daily review on the phone against the user's real Echo account: sign in, pick a deck, review its cards by flipping and swiping, see a summary. It follows the "Echo Review" design canvas (page "Итерация 1") and its developer stickers; motion, transitions and drawn illustrations are part of the requirement, not decoration.

## Requirements

### Sign-in
1. The app signs in with the same email and password as the web app; there is no separate account.
2. The session survives app restarts and refreshes itself; when it can no longer be refreshed the app returns to the sign-in screen.
3. Wrong credentials and network failures show a short handwritten message; nothing else changes.
4. "Ещё" in the bottom navigation opens a page: the sections as one large comma list (Новая колода, Черновики with the real draft count, Импорт, AI-агенты, Голоса), the preferences as a sentence whose words you tap, the signed-in account and "Выйти". Sections and switches that are not built yet say "Появится в следующей итерации"; "примеры под карточкой спрятаны / открыты сразу" works and is kept on the phone.
4a. The sign-in screen shows the cat peeking from behind a stack of cards, the title "Слова ждут. / Заходи.", the email and password fields and "Войти". "Создать аккаунт" opens the web login page; "Забыл пароль" and the language switch are not built yet.
4b. A phone build always talks to the production API; a build pointed at a local server must never be installed for the user.

### Home (deck choice)
5. Decks, their due counts, draft counts and "done for today" come from the user's data and match the web home for the same moment and time zone.
6. Review works per deck: nothing starts until a deck is picked. Picking a deck lays a paper card behind its row (text never moves), turns its count green, dims the others and slides the action up; tapping it again clears the choice.
6a. A cat sits on the top edge of the screen with its paws and tail hanging down. While no deck is picked, one quiet line under the list says "Выбери колоду, чтобы начать". Rows have no divider lines.
7. A deck with nothing due shows a self-drawing green check with sparks instead of "0" and "на сегодня готово"; its action is extra review only.
8. One action button per state: "Ревью на сегодня N" when cards are due, otherwise "Дополнительное ревью N" under the sentence "Ещё N <kind> из этой колоды." whose number (20/10/50) and kind (сложных/новых/случайных/забытых) are words you tap to change.
9. Screen title: always two lines in a fixed block; each line is its own string, sized to its width from 44 down to 28, then ellipsis; nothing below moves with the text. Deck names: at most two lines with hyphenation, then ellipsis; the count column is fixed.
10. Loading, failure (with retry) and "no decks yet" states keep the same layout.

### Review
11. Cards are those of the web session: today's due cards in the web order, or the chosen extra pool. The app adds no review rules of its own; every rule comes from the web code through the server.
12. Audio is the note's generated recording, the same file the web plays (ElevenLabs, `audio_cache`); there is no on-device speech. A card without a recording shows no speaker. Recognition cards play when they land on top; production cards (Russian first) play only after the flip, as on the web.
12a. "Снова" and "Сложно" send the card back into the current session at the position the web review loop uses; "Нормально" and "Легко" let it leave. The counter and the progress line work like the web: reviews done out of reviews done plus cards still in the queue, so a returned card makes the total grow.
13. Tapping the card (or "Показать ответ") flips it in place. The answer becomes the main text in the same top-left place and the front moves to the bottom in grey; under the card there is a chevron, in the footer the four grades.
13a. "Ещё" during a review opens a sheet over the dimmed card: "Редактировать" and "Отложить до завтра" (not built yet), "Скрыть карточку" (the web's hide until the end of the session: the card leaves the queue without a grade), the display settings as a sentence and "Закончить ревью", which returns to the decks. Tapping the dim, "Закрыть" or Back closes it.
14. Pulling the card up or tapping the chevron opens the slip under it with examples (the studied phrase on a pale-green wash), near expressions and metadata; pulling down closes it. The slip is as tall as its content up to the free space and never covers the footer.
15. Swiping works exactly like the web review: a swipe left past 96 grades Снова, right past 96 grades Легко, anything shorter springs back; Сложно and Нормально stay on the buttons. The card follows the finger up to 160, tilts and fades like the web, and tracking starts only after 10 of mostly horizontal movement (a mostly vertical pull works the slip). A scale shows the two outcomes while dragging, a haptic tick marks crossing the commit distance, release flies the card off and the next rises from the stack. The distances and side ratings come from the web code, not the app.
16. Every grade updates the FSRS schedule exactly like a web review and is logged; grades are sent in order and a failed send is retried, never dropped. A retry of a grade that already reached the server changes nothing (no second schedule step, no second review row). Grades stay with the account that made them: after a sign-out they are never sent under another account.
17. The swipe hint (cat between arrows) follows the sticker: only on the back with the slip closed, 1.2 s after the flip, only for the first 3 grades of a session, never again after 10 successful swipes, hidden while touching, and static when the system removes animations.
18. After the last card: "Это была последняя." and "Итоги". The session counts as finished at that moment, as on the web, even if the summary is never opened. There is no "review again" action: the web has none.

### Summary
19. The fat cat swats the ball off the table; card count, accuracy, time (the sum of the time spent on each graded card, as on the web) and struggled cards count up; the grade bar grows segment by segment.
20. Finishing today's session marks the deck "done for today" on every device, but only after all of the session's grades are saved (as on the web); a failed completion is retried. "К колодам" returns home; the underlined line starts another extra session with the last chosen count and kind.

## Non-goals
- Statistics, deck/note editing, drafts, audio files and Google sign-in (all current accounts use email + password).
- Offline review; grades queue only for the current app run.
- Interface languages other than Russian, English and Czech.

### Languages and icon
21. The interface is available in Russian, English and Czech, including plurals, dates and the two-line titles. A new install follows the phone's language (English when it is none of the three). The language is switched in the app: the code in the sign-in top bar (RU / EN / CS) and the language word in the "Ещё" sentence, each tap moving to the next language. Card content is never translated.
22. The launcher icon is the cat holding on to a stack of cards with one green dot on a graphite background; the themed (monochrome) icon and the splash use the same drawing as line art.
