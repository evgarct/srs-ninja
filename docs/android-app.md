# Android app (iteration 1)

Native Kotlin + Jetpack Compose app in `android/`, package `com.evgarct.echo`. It implements the "Итерация 1" page of the "Echo Review" design canvas: Home (deck choice) → Review (card stack) → Summary, plus a sign-in screen in the same visual language.

## Build and run
- Toolchain: AGP 9.4, Kotlin 2.4, compose-bom 2026.09, compile/target SDK 37, min SDK 34. Only the `com.android.application` and Kotlin Compose plugins are applied, so JVM 21 is set through `compileOptions` (there is no `kotlinOptions` block).
- `cd android; gradle :app:assembleDebug` (global Gradle 9.7.1 matches the wrapper).
- Config is read at build time from the web app's ignored `../.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public values). Pull it with `npx vercel env pull .env.local --environment=production`.
- API base: `-Pecho.apiBase`, else `APP_URL` from `.env.local` when it is an `https://` URL, else production `https://echo-phi-one.vercel.app`. `vercel env pull` writes sensitive variables as the placeholder `[SENSITIVE]`, so `APP_URL` is usually ignored. The build fails when the base is not a URL or the Supabase values are missing, and prints `Echo API base: …` so a local build is never mistaken for a phone build.
- Phone build: plain `gradle :app:assembleDebug` (production API), check the printed base, then `adb -s <phone> install -r app/build/outputs/apk/debug/app-debug.apk`. A build made with `-Pecho.apiBase=http://localhost:3000` cannot reach the API from a phone without `adb reverse`; that is what broke sign-in on 2026-11-09. The `/api/mobile/*` routes must be deployed to production for the phone build to work.
- Local API: `gradle :app:assembleDebug -Pecho.apiBase=http://localhost:3000`, run `next dev`, then `adb reverse tcp:3000 tcp:3000` (works for the emulator and for a phone on wireless adb). Cleartext HTTP is allowed only to `localhost` and `10.0.2.2` (`res/xml/network_security_config.xml`).

## Data and auth
- `data/EchoApi.kt` signs in against Supabase Auth (`/auth/v1/token?grant_type=password`), stores the session in private shared preferences, refreshes it 60 s before expiry, refreshes once more on a 401 and signs out when refresh is refused.
- The app never talks to PostgREST directly. It calls the web app's `/api/mobile/*` routes with `Authorization: Bearer <access token>`:
  - `GET /api/mobile/home?tz=<IANA>` → decks with `due`, `total`, `drafts`, `completedToday` (`getDashboardStatsForUser`, shared with the web home).
  - `GET /api/mobile/decks/:id/session?mode=due` → today's cards via `getDueCardsForUser` + `selectReviewSessionCards(orderCards)`, the same pipeline as the web session. Each card carries `audioUrl` from `getExpressionAudioMap` (shared with the web review page, `src/lib/review-audio.ts`), and the response carries `swipe` (`buildSwipeRules` from the web `review-swipe.ts`: commit distance 96, max offset 160, lock distance 10, left = again, right = easy) and `requeue`: `getReviewRequeueWindow` (web `review-loop.ts`) for Again and Hard at every reachable queue length, so the app reinserts cards like the web without a round trip.
  - `GET …/session?mode=extra&limit=N&kind=hard|new|random|forgotten` → `getExtraStudyCardsByKind`; without `kind` it falls back to the web's extra study (`getExtraStudyCardsForUser`).
  - `POST /api/mobile/reviews {cardId, rating, durationMs, reviewId}` → `submitReviewForUser` (ts-fsrs schedule + `reviews` log), identical to the in-app server action. `reviewId` is a client UUID used as the `reviews.id`; if that row already exists the call returns `duplicate: true` without touching the card, so retries after a lost response are safe.
  - `POST /api/mobile/decks/:id/complete {sessionType}` → `review_session_completions`, so the deck shows "done today" on every device.
- `resolveMobileContext` (`src/lib/mobile-api.ts`) verifies the token with `auth.getUser` and builds a Supabase client carrying it, so every query runs under the user's RLS. Unlike `/api/mcp` it does not require an OAuth `client_id`, because the app uses a first-party password session. The cookie middleware lets `/api/mobile/*` through (`shouldBypassAuthRedirect`).
- `mapCardForMobile` reuses `mapFieldsToFlashcard`: recognition shows the expression first, production the translation; `spoken` is always the target-language expression; examples are split around their first `<b>` into `pre/hit/post` for the highlight.
- `data/GradeSync.kt` sends grades one at a time in order with exponential backoff, so a card flies away immediately and a flaky network never loses a grade during the run. Each queued grade remembers its account; the worker only sends the signed-in account's grades, so a sign-out never leaks them to the next account, and `kick()` after sign-in resumes them. Session completion (`/complete`) waits for `awaitIdle()` and retries, matching the web's `pendingReviewCount === 0` gate.
- The app holds no review rules of its own: ordering, FSRS, requeue windows, audio and completion all come from the web code through these routes. The client renders, animates, measures gestures and keeps the queue in memory.
- Parity with `src/components/review-session.tsx`, item by item:
  - Counter and progress: reviews done / (reviews done + cards left in the queue), so a requeued card makes the total grow (web `completedReviews`, `projectedTotal`).
  - Summary time: the sum of each graded card's time from landing on top to the grade (web `durationMs`), not wall-clock time.
  - Completion: fired when a grade empties the queue (web `didCompleteQueue`), not when the summary is opened; it still waits for every grade to be saved.
  - "Скрыть карточку" in the review menu is the web's "hide until the end of the session" (`excludeCurrentReviewCard`): the card leaves the queue without a grade; a queue emptied this way does not complete the session.
  - There is no "review the same cards again" action: the web has none, and it would log real reviews for cards that are no longer due.
  - Not on the web, so not in the app: postponing a card to tomorrow, an autoplay switch. The app has no note editor yet. These menu words show "Появится в следующей итерации".
- Audio: `MainActivity` plays `audioUrl` with `MediaPlayer` (no TTS). Cards without a recording show no speaker, like the web.

## UI structure
- `ui/theme/Theme.kt`: palette (paper ground `#F1ECE6`, graphite `#1D1C1A`, one green `#2E7A3C`), Onest / JetBrains Mono / Caveat as variable fonts in `res/font`, the house easing `cubic-bezier(.2,.8,.2,1)` and `LocalReducedMotion` (system animator scale 0).
- `ui/art/`: the canvas SVGs drawn on a Compose `Canvas` from their original path strings (`PathParser`), animated by one frame clock and CSS-style keyframes (`kf`). With reduced motion the clock freezes on a meaningful frame.
- Drawings: `PeekingCat` (sign-in, rises from behind a stack of cards), `SittingCat` (home, sits on the top screen edge; lowered by the status-bar height so only its two sides pass behind the system icons), `SelfDrawingCheck`, `TapPaw`, `SwipeHintCat`, `SassyCat` (summary). `shape()` draws a path with a paper fill under its stroke.
- `ui/home/HomeScreen.kt` is the top-level screen: the deck list or `MoreScreen` above the shared `BottomNav`. "Ещё" is a full page (sections as a comma list with the real draft count, preferences as a sentence, account and sign-out), not a popup.
- `SwitchSentence` (`Components.kt`) renders a setting as a sentence whose tappable words get a dotted underline. `ui/Prefs.kt` (`EchoPrefs`) keeps display-only preferences on the phone; today that is "примеры под карточкой спрятаны / открыты сразу" (whether the slip opens with the answer).
- Card faces: the main text is always top left (front before the flip, answer after, auto-sized 32 → 24 / 21 sp, 3 lines); after the flip the front goes to the bottom in grey (19 → 17 sp, 2 lines). `CardMenu` in `ReviewScreen.kt` is the "Ещё" sheet of a review.
- `ui/Components.kt`: `TitleLine` (two-line title rule: 46 sp rows, 44 → 28 sp auto-size, unclipped glyphs, scales with font size), `PrimaryAction`, `TextAction`, `pressable` (scale .97), `riseIn` (the canvas `echoUp`), `rangeLineRects` for per-line highlight and dotted-underline drawing.
- `ui/EchoApp.kt`: screen state machine and the paper transitions between screens (next sheet rises, previous settles back).
- `ui/review/ReviewScreen.kt`: stack geometry from the canvas (each layer 11 dp in and 12 dp up), 3D flip, the web swipe from the server's `SwipeRules` (axis lock, clamp, commit distance; web tilt x/20 and fade to 0.74), fly-out with `cubic-bezier(.5,0,.75,0)`, slip with `cubic-bezier(.2,.9,.2,1)`, swipe-hint rules, the in-memory session queue (Again/Hard reinserted via the server's requeue table), recorded audio through `LocalSpeaker`.
- The app locale is pinned to `ru` through `LocaleManager` so plurals and dates follow Russian rules on any phone.

## Testing
- Unit: `src/lib/mobile-api.test.ts` (example splitting, card mapping both directions, time zones, middleware bypass).
- Test user: `node scripts/seed-android-test-user.mjs` creates or resets `android-test@echo.test` with decks in every home state (due cards, a small deck, a deck done today with new cards for extra study, a very long deck name). Credentials are written to the ignored `android/test-user.properties`.
- API smoke check: `node scripts/check-mobile-api.mjs [apiBase] [--grade]` signs in as the test user and prints home, a due session and an extra session.
- Device check: emulator `medium_phone` (1080×2400) with `adb reverse`, then the phone against production.
