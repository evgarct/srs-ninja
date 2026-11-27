# Authentication redirect configuration

Email sign-up and Google OAuth use the same canonical callback URL: `${APP_URL}/auth/callback`.

For the current Vercel production project, `APP_URL` is `https://echo.safronov.dev`, so the exact callback is `https://echo.safronov.dev/auth/callback`. The old `https://echo-phi-one.vercel.app` alias still serves the same deployment, but it is no longer the canonical origin: MCP metadata, auth emails and the Android app use `echo.safronov.dev`.

`APP_URL` is required in production. The origin helper rejects missing values and localhost production values. In development only, the fallback is `http://localhost:3000`.

Supabase Auth must be configured separately:

1. Set **Site URL** to `https://echo.safronov.dev`.
2. Add `https://echo.safronov.dev/auth/callback` to **Redirect URLs** (keep the old `https://echo-phi-one.vercel.app/auth/callback` entry while older app builds are in use).
3. Keep `http://localhost:3000/auth/callback` only for local development.
4. Ensure the confirmation email template uses the redirect-aware confirmation URL (`ConfirmationURL` or `RedirectTo`) rather than constructing a link from a stale localhost Site URL.

If a requested redirect is absent from the Supabase allow list, Supabase may fall back to Site URL. Both application and dashboard configuration are therefore required.
