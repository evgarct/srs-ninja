# SRS Ninja — Tooling Hygiene

## Goal

Keep the local development environment and repository hygiene stable so routine verification commands work reliably in WSL-based development.

## Requirements

- The project must not rely on Windows-only binaries when running inside WSL if an equivalent Linux binary is available.
- Local assistant metadata and generated artifacts must not pollute `git status`.
- Generated Storybook output must not be linted as source code.
- Storybook static builds must avoid noisy non-actionable warnings from known Vite bundling behavior for `"use client"` directives.
- The Next.js request interception entrypoint must follow the supported file convention for the current Next.js version.
- Default verification commands must complete successfully on a prepared local checkout:
  - `npm run lint`
  - `npx next typegen`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run build-storybook`

## Expected Outcome

Developers can run the standard local checks in WSL without spurious failures from generated files, deprecated framework entrypoints, or environment-specific workspace artifacts.
