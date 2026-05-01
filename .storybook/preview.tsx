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
      test: 'todo',
    },
  },
}

export default preview
