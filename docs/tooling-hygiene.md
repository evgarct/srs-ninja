# Tooling Hygiene

## Purpose

This branch keeps local development and verification predictable across WSL and project tooling.

## What changed

- WSL shells now prefer native Linux binaries before inherited Windows PATH entries.
- Local Codex workspace metadata in `.agents/` is ignored by Git.
- ESLint ignores generated Storybook build output in `storybook-static/`.
- The Next.js request interception entrypoint now uses `src/proxy.ts` instead of the deprecated `src/middleware.ts` convention.
- Storybook example files were cleaned up so default verification commands pass without noise.

## Verification

After these changes, the standard local verification flow succeeds:

- `npm run lint`
- `npx next typegen`
- `npx tsc --noEmit`
- `npm run build`
