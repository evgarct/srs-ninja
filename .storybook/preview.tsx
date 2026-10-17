import '../src/app/globals.css'
import type { Preview } from '@storybook/nextjs-vite'
import { Inter } from 'next/font/google'
import { createElement } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import ruMessages from '../messages/ru.json'

const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] })

const preview: Preview = {
  initialGlobals: {
    theme: 'dark',
  },
  globalTypes: {
    theme: {
      description: 'Light / dark theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', icon: 'circle', title: 'Dark' },
          { value: 'light', icon: 'circlehollow', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'light' ? 'light' : 'dark'
      return createElement(
        NextIntlClientProvider,
        { locale: 'ru', messages: ruMessages },
        // `key={theme}` remounts the provider on toggle so its internal theme
        // state (and therefore `resolvedTheme` from `useTheme()`) always
        // matches the Storybook toolbar selection, not just the DOM class.
        createElement(
          ThemeProvider,
          { key: theme, attribute: 'class', defaultTheme: theme, enableSystem: false },
          createElement(
            'div',
            {
              className: `${inter.className} min-h-screen bg-background text-foreground`,
              'data-theme': theme,
            },
            createElement(Story)
          )
        )
      )
    },
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' — a11y addon is active in Storybook UI (shows violations in the panel)
      // but does NOT run assertions in vitest. Individual stories opt in to 'warn'
      // or 'error' via story-level parameters once their violations are fixed.
      // Background: Storybook 10 treats 'warn' identically to 'error' in vitest
      // (calls expect().toHaveNoViolations()), so a global 'warn' would break all
      // stories that have pre-existing Base UI / color-contrast violations.
      test: 'todo',
    },
  },
}

export default preview
