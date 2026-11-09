# Android app, iteration 1 (review flow) — expected behavior

## Goal
A native Android app runs the daily review on the phone against the user's real Echo account: sign in, pick a deck, review its cards by flipping and swiping, see a summary. It follows the "Echo Review" design canvas (page "Итерация 1") and its developer stickers; motion, transitions and drawn illustrations are part of the requirement, not decoration.

## Requirements

### Sign-in
1. The app signs in with the same email and password as the web app; there is no separate account.
2. The session survives app restarts and refreshes itself; when it can no longer be refreshed the app returns to the sign-in screen.
3. Wrong credentials and network failures show a short handwritten message; nothing else changes.
4. "Ещё" in the bottom navigation shows the signed-in account and a sign-out action.

### Home (deck choice)
5. Decks, their due counts, draft counts and "done for today" come from the user's data and match the web home for the same moment and time zone.
6. Review works per deck: nothing starts until a deck is picked. Picking a deck lays a paper card behind its row (text never moves), turns its count green, dims the others and slides the action up; tapping it again clears the choice.
7. A deck with nothing due shows a self-drawing green check with sparks instead of "0" and "на сегодня готово"; its action is extra review only.
8. One action button per state: "Ревью на сегодня N" when cards are due, otherwise "Дополнительное ревью N" under the sentence "Ещё N <kind> из этой колоды." whose number (20/10/50) and kind (сложных/новых/случайных/забытых) are words you tap to change.
9. Screen title: always two lines in a fixed block; each line is its own string, sized to its width from 44 down to 28, then ellipsis; nothing below moves with the text. Deck names: at most two lines with hyphenation, then ellipsis; the count column is fixed.
10. Loading, failure (with retry) and "no decks yet" states keep the same layout.

### Review
11. Cards are those of the web session: today's due cards in the web order, or the chosen extra pool.
12. Recognition cards speak the phrase when they land on top and on the speaker button; production cards (Russian first) speak the answer only after the flip, so audio never gives the answer away.
13. Tapping the card (or "Показать ответ") flips it in place; the back shows the translation, a chevron under the card and the four grades in the footer.
14. Pulling the card up or tapping the chevron opens the slip under it with examples (the studied phrase on a pale-green wash), near expressions and metadata; pulling down closes it. The slip is as tall as its content up to the free space and never covers the footer.
15. Dragging grades by distance: a little right = Нормально, far right = Легко, a little left = Сложно, far left = Снова; a scale shows the choice while dragging, a haptic tick marks each change, release flies the card off and the next rises from the stack.
16. Every grade updates the FSRS schedule exactly like a web review and is logged; grades are sent in order and a failed send is retried, never dropped.
17. The swipe hint (cat between arrows) follows the sticker: only on the back with the slip closed, 1.2 s after the flip, only for the first 3 grades of a session, never again after 10 successful swipes, hidden while touching, and static when the system removes animations.
18. After the last card: "Это была последняя.", then the summary.

### Summary
19. The sassy cat swats the ball off the table; card count, accuracy, time and struggled cards count up; the grade bar grows segment by segment.
20. Finishing today's session marks the deck "done for today" on every device. "К колодам" returns home; the underlined line starts another extra session with the last chosen count and kind.

## Non-goals
- Statistics, deck/note editing, drafts, audio files and Google sign-in (all current accounts use email + password).
- Offline review; grades queue only for the current app run.
- Localizations other than Russian (strings are already split per line for them).
