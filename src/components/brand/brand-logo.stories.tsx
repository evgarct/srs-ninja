import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BrandLogo, BrandMark } from './brand-logo'

const meta: Meta<typeof BrandLogo> = {
  title: 'Brand/BrandLogo',
  component: BrandLogo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof BrandLogo>

export const Wordmark: Story = {
  args: {},
}

export const MarkOnly: Story = {
  render: () => <BrandMark className="size-12" />,
}

export const Inverse: Story = {
  render: () => (
    <div className="rounded-3xl bg-[#171717] px-6 py-5">
      <BrandLogo tone="inverse" />
    </div>
  ),
}
