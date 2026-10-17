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
      // next-themes persists the last theme it was given (via setTheme, e.g.
      // from the nav's own theme menu or an interaction test) to localStorage,
      // and a `ThemeProvider` remount reads that back as its initial state —
      // `defaultTheme` is only a fallback for when nothing is stored. Clear it
      // on every render so a story always starts from the toolbar's choice,
      // and pass `forcedTheme` so the DOM class stays pinned to the toolbar
      // even if something inside the story calls `setTheme` afterwards.
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('theme')
        } catch {
          // ignore (e.g. storage disabled)
        }
      }
      // `forcedTheme` tells next-themes' `useTheme()` what to report, but its
      // own DOM-class application runs via an injected script tag + effect
      // that isn't guaranteed to have run yet in every rendering context
      // (e.g. the addon-vitest browser-mode test runner, which snapshots the
      // DOM for accessibility checks before React effects settle). Set the
      // class on `<html>` directly and synchronously so the CSS cascade is
      // never left on its stale/default state.
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
      }
      return createElement(
        NextIntlClientProvider,
        { locale: 'ru', messages: ruMessages },
        // `key={theme}` remounts the provider on toggle so its internal theme
        // state (and therefore `resolvedTheme` from `useTheme()`) always
        // matches the Storybook toolbar selection, not just the DOM class.
        createElement(
          ThemeProvider,
          {
            key: theme,
            attribute: 'class',
            defaultTheme: theme,
            forcedTheme: theme,
            enableSystem: false,
          },
          createElement(
            'div',
            {
              // `className={theme}` here (not just on `<html>`) is the belt
              // to `document.documentElement`'s suspenders: the addon-vitest
              // browser-mode test runner appears not to reliably honor a
              // class applied to the real `<html>` element for this preview
              // tree, so the `@custom-variant dark (&:is(.dark *))` selector
              // needs `.dark` somewhere inside the actually-rendered subtree
              // too, not only on the document root.
              className: `${inter.className} ${theme} min-h-screen bg-background text-foreground`,
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
