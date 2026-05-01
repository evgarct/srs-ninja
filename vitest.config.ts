import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // ── Layer 1: Fast unit tests (Node, no browser) ───────────────────────
      // Tests for business logic in src/lib/ — schemas, review algorithms,
      // import pipelines, FSRS scheduling, TTS, MCP, etc.
      // Run with: npm test  (or: npx vitest --project=unit)
      {
        resolve: {
          alias: {
            '@': path.join(dirname, 'src'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/lib/**/*.test.ts', 'src/lib/**/*.test.tsx'],
        },
      },

      // ── Layer 2: Storybook interaction tests (Playwright/Chromium) ────────
      // Runs story play() functions as real browser tests, including:
      // - Component interaction flows (reveal, filter toggles, dropdowns)
      // - i18n assertions across all 3 locales
      // - A11y checks on critical components (stories with a11y: 'error')
      // Run with: npm run test:ui  (or: npx vitest --project=storybook)
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
          include: ['src/**/*.stories.{ts,tsx}'],
          exclude: ['src/lib/**/*.test.ts'],
        },
      },
    ],
  },
});
