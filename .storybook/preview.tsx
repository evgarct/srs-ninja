import '../src/app/globals.css'
import type { Preview } from '@storybook/nextjs-vite'
import { Inter } from 'next/font/google'
import { createElement } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import ruMessages from '../messages/ru.json'

const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] })

const preview: Preview = {
  decorators: [
    (Story) =>
      createElement(
        NextIntlClientProvider,
        { locale: 'ru', messages: ruMessages },
        createElement('div', { className: inter.className }, createElement(Story))
      ),
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
      // 'warn' surfaces violations as warnings in Storybook UI and CI logs
      // without blocking test runs — lets us see real issues without a hard stop.
      // Critical components opt in to 'error' mode via story-level parameters.
      test: 'warn',
    },
  },
}

export default preview
