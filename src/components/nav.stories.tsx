import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'

import { Nav } from './nav'

const meta: Meta<typeof Nav> = {
  title: 'Navigation/Nav',
  component: Nav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Provide a mocked Next.js navigation context
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#090511' }],
    },
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-[200px] bg-[#090511]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Nav>

// ── Default: home page ────────────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Main nav links are present (nav is md:block so visible at desktop viewport)
    await canvas.findByRole('link', { name: /Колоды/i })
    await canvas.findByRole('link', { name: /Статистика/i })
    // Overflow button accessible
    await canvas.findByRole('button', { name: /Открыть дополнительные действия/i })
  },
}

// ── Stats page (active link changes) ─────────────────────────────────────────

export const StatsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/stats' },
    },
  },
}

// ── Overflow menu open ────────────────────────────────────────────────────────

export const OverflowMenuOpen: Story = {
  tags: ['!dev'],
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Open the overflow menu
    const menuBtn = await canvas.findByRole('button', {
      name: /Открыть дополнительные действия/i,
    })
    await userEvent.click(menuBtn)
    // Dropdown renders in a portal — search in document.body
    const body = within(document.body)
    // Create deck & import actions
    await body.findByText('Новая колода')
    await body.findByText('Импорт')
    // All three language options
    await body.findByText('🇬🇧 English')
    await body.findByText('🇷🇺 Русский')
    await body.findByText('🇨🇿 Čeština')
    // Logout option
    await body.findByText('Выйти')
  },
}

// ── Review route — nav hidden ─────────────────────────────────────────────────

export const HiddenOnReviewRoute: Story = {
  name: 'Hidden on review route',
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/decks/deck-1/review' },
    },
  },
  // Nav returns null on review routes — canvas is empty
}
