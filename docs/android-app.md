# Android app (iteration 1)

Native Kotlin + Jetpack Compose app in `android/`, package `com.evgarct.echo`. It implements the "Итерация 1" page of the "Echo Review" design canvas: Home (deck choice) → Review (card stack) → Summary, plus a sign-in screen in the same visual language.

## Build and run
- Toolchain: AGP 9.4, Kotlin 2.4, compose-bom 2026.09, compile/target SDK 37, min SDK 34. Only the `com.android.application` and Kotlin Compose plugins are applied, so JVM 21 is set through `compileOptions` (there is no `kotlinOptions` block).
- `cd android; gradle :app:assembleDebug` (global Gradle 9.7.1 matches the wrapper).
- Config is read at build time from the web app's ignored `../.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public values) and `APP_URL` as the API base. Pull it with `npx vercel env pull .env.local --environment=production`.
- Local API: `gradle :app:assembleDebug -Pecho.apiBase=http://localhost:3000`, run `next dev`, then `adb reverse tcp:3000 tcp:3000` (works for the emulator and for a phone on wireless adb). Cleartext HTTP is allowed only to `localhost` and `10.0.2.2` (`res/xml/network_security_config.xml`).

## Data and auth
- `data/EchoApi.kt` signs in against Supabase Auth (`/auth/v1/token?grant_type=password`), stores the session in private shared preferences, refreshes it 60 s before expiry, refreshes once more on a 401 and signs out when refresh is refused.
- The app never talks to PostgREST directly. It calls the web app's `/api/mobile/*` routes with `Authorization: Bearer <access token>`:
  - `GET /api/mobile/home?tz=<IANA>` → decks with `due`, `total`, `drafts`, `completedToday` (`getDashboardStatsForUser`, shared with the web home).
  - `GET /api/mobile/decks/:id/session?mode=due` → today's cards via `getDueCardsForUser` + `selectReviewSessionCards(orderCards)`, the same pipeline as the web session.
  - `GET …/session?mode=extra&limit=N&kind=hard|new|random|forgotten` → `getExtraStudyCardsByKind`; without `kind` it falls back to the web's extra study (`getExtraStudyCardsForUser`).
  - `POST /api/mobile/reviews {cardId, rating, durationMs}` → `submitReviewForUser` (ts-fsrs schedule + `reviews` log), identical to the in-app server action.
  - `POST /api/mobile/decks/:id/complete {sessionType}` → `review_session_completions`, so the deck shows "done today" on every device.
- `resolveMobileContext` (`src/lib/mobile-api.ts`) verifies the token with `auth.getUser` and builds a Supabase client carrying it, so every query runs under the user's RLS. Unlike `/api/mcp` it does not require an OAuth `client_id`, because the app uses a first-party password session. The cookie middleware lets `/api/mobile/*` through (`shouldBypassAuthRedirect`).
- `mapCardForMobile` reuses `mapFieldsToFlashcard`: recognition shows the expression first, production the translation; `spoken` is always the target-language expression; examples are split around their first `<b>` into `pre/hit/post` for the highlight.
- `data/GradeSync.kt` sends grades one at a time in order with exponential backoff, so a card flies away immediately and a flaky network never loses a grade during the run.

## UI structure
- `ui/theme/Theme.kt`: palette (paper ground `#F1ECE6`, graphite `#1D1C1A`, one green `#2E7A3C`), Onest / JetBrains Mono / Caveat as variable fonts in `res/font`, the house easing `cubic-bezier(.2,.8,.2,1)` and `LocalReducedMotion` (system animator scale 0).
- `ui/art/`: the canvas SVGs drawn on a Compose `Canvas` from their original path strings (`PathParser`), animated by one frame clock and CSS-style keyframes (`kf`). With reduced motion the clock freezes on a meaningful frame.
- `ui/Components.kt`: `TitleLine` (two-line title rule: 46 sp rows, 44 → 28 sp auto-size, unclipped glyphs, scales with font size), `PrimaryAction`, `TextAction`, `pressable` (scale .97), `riseIn` (the canvas `echoUp`), `rangeLineRects` for per-line highlight and dotted-underline drawing.
- `ui/EchoApp.kt`: screen state machine and the paper transitions between screens (next sheet rises, previous settles back).
- `ui/review/ReviewScreen.kt`: stack geometry from the canvas (each layer 11 dp in and 12 dp up), 3D flip, swipe thresholds ±40/±140 dp (`gradeForDrag`), fly-out with `cubic-bezier(.5,0,.75,0)`, slip with `cubic-bezier(.2,.9,.2,1)`, swipe-hint rules, TTS through `LocalSpeaker` (Android `TextToSpeech`).
- The app locale is pinned to `ru` through `LocaleManager` so plurals and dates follow Russian rules on any phone.

## Testing
- Unit: `src/lib/mobile-api.test.ts` (example splitting, card mapping both directions, time zones, middleware bypass).
- Test user: `node scripts/seed-android-test-user.mjs` creates or resets `android-test@echo.test` with decks in every home state (due cards, a small deck, a deck done today with new cards for extra study, a very long deck name). Credentials are written to the ignored `android/test-user.properties`.
- API smoke check: `node scripts/check-mobile-api.mjs [apiBase] [--grade]` signs in as the test user and prints home, a due session and an extra session.
- Device check: emulator `medium_phone` (1080×2400) with `adb reverse`, then the phone against production.
