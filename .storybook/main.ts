import type { StorybookConfig } from '@storybook/nextjs-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      build: {
        // Storybook bundles docs, addons, and preview code into a few large assets.
        // Raising the threshold keeps routine verification focused on actionable warnings.
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          onwarn(warning, warn) {
            if (
              warning.code === 'MODULE_LEVEL_DIRECTIVE'
              && warning.message.includes('"use client"')
            ) {
              return;
            }

            if (
              warning.message.includes('Error when using sourcemap for reporting an error')
              && warning.message.includes(`"use client"`)
            ) {
              return;
            }

            warn(warning);
          },
        },
      },
    });
  },
};
export default config;
