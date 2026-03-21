import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"
import { RatingButtons } from "./RatingButtons"

const meta: Meta<typeof RatingButtons> = {
  title: "Flashcard/RatingButtons",
  component: RatingButtons,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { onRate: fn() },
}
export default meta

type Story = StoryObj<typeof RatingButtons>

export const WithIntervals: Story = {
  args: {
    intervals: {
      again: "<10m",
      hard: "<15m",
      good: "18d",
      easy: "29d",
    },
  },
}

export const WithoutIntervals: Story = {}

export const LongIntervals: Story = {
  args: {
    intervals: {
      again: "<10m",
      hard: "3d",
      good: "21d",
      easy: "42d",
    },
  },
}

export const MobileTouchTargets: Story = {
  args: {
    intervals: {
      again: "<1m",
      hard: "12m",
      good: "3d",
      easy: "8d",
    },
  },
  render: (args) => (
    <div className="w-[22rem] max-w-full p-3">
      <RatingButtons {...args} />
    </div>
  ),
}

export const MobileStickyBar: Story = {
  args: {
    intervals: {
      again: "<1m",
      hard: "8m",
      good: "2d",
      easy: "5d",
    },
    stickyMobile: true,
  },
  render: (args) => (
    <div className="relative min-h-[18rem] w-[24rem] max-w-full overflow-hidden rounded-[28px] border border-foreground/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-3">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,248,214,0.00),rgba(255,248,214,0.16),rgba(193,231,255,0.28),rgba(255,255,255,0.40),rgba(193,231,255,0.20),rgba(255,248,214,0.00))] blur-2xl" />
      <div className="relative h-28 rounded-[24px] border border-foreground/10 bg-background/72" />
      <div className="fixed inset-x-0 bottom-0 px-3 pt-3 pb-6">
        <div className="mx-auto max-w-[24rem] rounded-[28px] border border-foreground/10 bg-background/92 p-3 shadow-[0_-10px_35px_-26px_hsl(var(--foreground)/0.45)] backdrop-blur-xl">
          <RatingButtons {...args} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}
